import { useState, type FormEvent } from 'react';
import { useUpdatePhoto } from '../hooks/usePhotos';
import type { Photo } from '../types';

interface Props {
  photo: Photo;
  albumId: string;
  onClose: () => void;
}

export function PhotoEditModal({ photo, albumId, onClose }: Props) {
  const updatePhoto = useUpdatePhoto();
  const [title, setTitle] = useState(photo.title);
  const [note, setNote] = useState(photo.note);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await updatePhoto.mutateAsync({ id: photo.id, albumId, title, note });
    onClose();
  };

  return (
    <div className="photo-edit-overlay">
      <div className="photo-edit-backdrop" onClick={onClose} />
      <div className="photo-edit-card" role="dialog" aria-modal="true" aria-label="Edit photo">
        <h2 className="photo-edit-title">Edit photo</h2>
        <form className="photo-edit-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="photo-title">Title</label>
            <input
              id="photo-title"
              type="text"
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Photo title"
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="photo-note">Note</label>
            <textarea
              id="photo-note"
              className="field-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write a note for viewers…"
              rows={5}
            />
          </div>
          <div className="photo-edit-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updatePhoto.isPending}>
              {updatePhoto.isPending ? <span className="spinner" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
