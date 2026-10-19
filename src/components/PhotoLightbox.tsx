import { setImageFallback } from '../lib/setImageFallback';
import type { Photo } from '../types';

type PhotoLightboxProps = {
  photo: Photo;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onNoteChange: (photoId: string, note: string) => void;
  canEdit: boolean;
  onEditPhoto?: () => void;
};

export function PhotoLightbox({ photo, onClose, onNext, onPrev, onNoteChange, canEdit, onEditPhoto }: PhotoLightboxProps) {
  return (
    <section className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`Photo detail ${photo.title}`}>
      <div className="lightbox-backdrop" onClick={onClose} />
      <div className="lightbox-card">
        <div className="lightbox-media">
          <img alt={photo.title} src={photo.src} onError={(e) => setImageFallback(e, photo.title)} />
          <div className="lightbox-actions">
            <button className="nav-item" type="button" onClick={onPrev}>Previous</button>
            <button className="nav-item" type="button" onClick={onNext}>Next</button>
          </div>
        </div>
        <aside className="lightbox-note-panel">
          <button className="nav-item close-lightbox" type="button" onClick={onClose}>Close</button>
          <p className="owner-badge">{canEdit ? 'Gallery note' : 'Photo note'}</p>
          <h2>{photo.title}</h2>
          <p>{canEdit ? 'This note is visible to viewers when this gallery is public.' : 'Shared note from the gallery owner.'}</p>
          {canEdit ? (
            <>
              <textarea
                value={photo.note}
                onChange={(e) => onNoteChange(photo.id, e.target.value)}
                placeholder="Write a note for viewers and yourself…"
                rows={8}
              />
              {onEditPhoto && (
                <button type="button" className="btn-ghost" style={{ marginTop: '0.75rem', width: '100%' }} onClick={onEditPhoto}>
                  Edit title &amp; note
                </button>
              )}
            </>
          ) : (
            <div className="public-note">{photo.note.trim() || 'No note added for this photo yet.'}</div>
          )}
        </aside>
      </div>
    </section>
  );
}
