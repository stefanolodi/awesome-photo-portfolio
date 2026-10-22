import { act, renderHook } from '@testing-library/react';
import { draftOf, usePhotoAutosave, type PhotoDraft } from './usePhotoAutosave';
import type { Photo } from '../types';

vi.mock('../lib/supabase', () => ({ supabase: {} }));

const photo: Photo = {
  id: 'photo-1',
  title: 'Beach',
  note: 'Beach note',
  src: 'https://example.test/beach.jpg',
  publicId: 'beach',
  displayOrder: 0,
};

type Call = { draft: PhotoDraft; changes: Partial<PhotoDraft>; resolve: (ok: boolean) => void };

// A save the test settles by hand, so it can edit while a save is pending.
function manualSave() {
  const calls: Call[] = [];
  const save = vi.fn((draft: PhotoDraft, changes: Partial<PhotoDraft>) =>
    new Promise<boolean>((resolve) => { calls.push({ draft, changes, resolve }); }));
  return { calls, save };
}

async function settle(call: Call, ok: boolean) {
  await act(async () => { call.resolve(ok); await Promise.resolve(); });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('usePhotoAutosave', () => {
  it('sends one save 800 ms after the last edit', async () => {
    const { calls, save } = manualSave();
    const { result } = renderHook(() => usePhotoAutosave(photo, draftOf(photo), save));

    act(() => result.current.editNote('a'));
    act(() => { vi.advanceTimersByTime(500); });
    act(() => result.current.editNote('ab'));
    act(() => { vi.advanceTimersByTime(799); });
    expect(save).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(1); });
    expect(calls.map((c) => c.changes)).toEqual([{ note: 'ab' }]);
    expect(result.current.status).toBe('saving');

    await settle(calls[0], true);
    expect(result.current.status).toBe('saved');
  });

  it('sends an edit made during a pending save after that save succeeds', async () => {
    const { calls, save } = manualSave();
    const { result } = renderHook(() => usePhotoAutosave(photo, draftOf(photo), save));

    act(() => result.current.editNote('ab'));
    act(() => result.current.leaveNote());
    act(() => result.current.editNote('abc'));
    act(() => result.current.leaveNote());
    expect(calls).toHaveLength(1);

    await settle(calls[0], true);
    expect(calls.map((c) => c.changes)).toEqual([{ note: 'ab' }, { note: 'abc' }]);
  });

  it('sends an edit queued behind a failed save, so the caller holds the latest text', async () => {
    const { calls, save } = manualSave();
    const { result, unmount } = renderHook(() => usePhotoAutosave(photo, draftOf(photo), save));

    act(() => result.current.editNote('ab'));
    act(() => result.current.leaveNote());
    act(() => result.current.editNote('abc'));
    unmount();

    await settle(calls[0], false);
    expect(calls.map((c) => c.draft.note)).toEqual(['ab', 'abc']);
  });

  it('tries again on the next edit after a failed save', async () => {
    const { calls, save } = manualSave();
    const { result } = renderHook(() => usePhotoAutosave(photo, draftOf(photo), save));

    act(() => result.current.editNote('ab'));
    act(() => result.current.leaveNote());
    await settle(calls[0], false);
    expect(result.current.status).toBe('idle');
    expect(result.current.draft.note).toBe('ab');

    act(() => result.current.editNote('abc'));
    act(() => result.current.leaveNote());
    expect(calls.map((c) => c.changes)).toEqual([{ note: 'ab' }, { note: 'abc' }]);
  });

  it('passes the saved title in the draft when the title is blank and the note changed', async () => {
    const { calls, save } = manualSave();
    const { result } = renderHook(() => usePhotoAutosave(photo, draftOf(photo), save));

    act(() => result.current.editTitle(' '));
    act(() => result.current.editNote('New note'));
    await act(async () => { vi.advanceTimersByTime(800); });

    expect(calls[0].draft).toEqual({ title: 'Beach', note: 'New note' });
    expect(calls[0].changes).toEqual({ note: 'New note' });
  });
});
