import { fireEvent, render, screen } from '@testing-library/react';
import { PhotoDetailsEditor } from './PhotoDetailsEditor';
import { draftOf } from '../hooks/usePhotoAutosave';
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

function renderEditor() {
  const onSave = vi.fn(() => Promise.resolve(true));
  render(<PhotoDetailsEditor photo={photo} initialDraft={draftOf(photo)} onSave={onSave} />);
  return onSave;
}

describe('PhotoDetailsEditor', () => {
  it('puts a cleared title back to the saved one when the owner leaves the field, and sends no save', () => {
    const onSave = renderEditor();
    const title = screen.getByRole('textbox', { name: 'Title' });

    fireEvent.change(title, { target: { value: '' } });
    fireEvent.blur(title);

    expect(title).toHaveValue('Beach');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('leaves the note field on Escape, and the blur saves the edit', async () => {
    const onSave = renderEditor();
    const note = screen.getByRole('textbox', { name: 'Note' });
    note.focus();

    fireEvent.change(note, { target: { value: 'New note' } });
    fireEvent.keyDown(note, { key: 'Escape' });

    expect(note).not.toHaveFocus();
    expect(onSave).toHaveBeenCalledWith({ title: 'Beach', note: 'New note' }, { note: 'New note' });
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('leaves the title field on Escape', () => {
    renderEditor();
    const title = screen.getByRole('textbox', { name: 'Title' });
    title.focus();

    fireEvent.keyDown(title, { key: 'Escape' });

    expect(title).not.toHaveFocus();
  });
});
