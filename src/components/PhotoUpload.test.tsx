import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { PhotoUpload } from './PhotoUpload';
import type { FakeDatabase } from '../test/fakeSupabase';
import { renderWithProviders } from '../test/renderWithProviders';
import { getUploadSignature, uploadToCloudinary } from '../lib/cloudinary';

const db = vi.hoisted((): FakeDatabase => ({}));

vi.mock('../lib/supabase', async () => {
  const { fakeSupabase } = await import('../test/fakeSupabase');
  return { supabase: fakeSupabase(db) };
});

vi.mock('../lib/cloudinary', () => ({
  getUploadSignature: vi.fn(),
  uploadToCloudinary: vi.fn(),
}));

const session = { access_token: 'token' } as Session;
const image = (name: string) => new File(['pixels'], `${name}.jpg`, { type: 'image/jpeg' });

function pick(container: HTMLElement, files: File[]) {
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files } });
}

beforeEach(() => {
  db.photos = [];
  vi.mocked(getUploadSignature).mockReset();
  vi.mocked(uploadToCloudinary).mockReset();
});

describe('PhotoUpload', () => {
  it('tells the owner when the upload cannot start, and lets them try again', async () => {
    vi.mocked(getUploadSignature).mockRejectedValue(new Error('Failed to get upload signature (500)'));
    const { container } = renderWithProviders(<PhotoUpload albumId="album-1" />, { isOwner: true, auth: { session } });
    pick(container, [image('beach')]);
    fireEvent.click(screen.getByRole('button', { name: 'Upload 1 photo' }));

    expect(await screen.findByText('The upload could not start. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload 1 photo' })).toBeEnabled();
  });

  it('puts new photos after the album\'s photos in grid order, whichever upload finishes first', async () => {
    db.photos = [
      { id: 'old-1', album_id: 'album-1', title: 'old-1', display_order: 0 },
      { id: 'old-2', album_id: 'album-1', title: 'old-2', display_order: 4 },
    ];
    vi.mocked(getUploadSignature).mockResolvedValue({} as Awaited<ReturnType<typeof getUploadSignature>>);
    // Each upload waits until the test finishes it by hand.
    const finish = new Map<string, () => void>();
    vi.mocked(uploadToCloudinary).mockImplementation((file) =>
      new Promise((resolve) => {
        const name = file.name.replace('.jpg', '');
        finish.set(name, () => resolve({ url: `https://example.test/${name}.jpg`, publicId: name, width: 10, height: 10 }));
      }));

    const { container } = renderWithProviders(<PhotoUpload albumId="album-1" />, { isOwner: true, auth: { session } });
    pick(container, [image('first'), image('second')]);
    pick(container, [image('third')]);
    fireEvent.click(screen.getByRole('button', { name: 'Upload 3 photos' }));

    await waitFor(() => expect(finish.size).toBe(3));
    for (const name of ['third', 'second', 'first']) {
      await act(async () => {
        finish.get(name)!();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    }

    await waitFor(() => expect(db.photos).toHaveLength(5));
    const orderOf = (title: string) => db.photos.find((p) => p.title === title)!.display_order;
    expect([orderOf('first'), orderOf('second'), orderOf('third')]).toEqual([5, 6, 7]);
  });
});
