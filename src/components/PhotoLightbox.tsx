import { setImageFallback } from '../lib/setImageFallback';
import type { PhotoDraft } from '../hooks/usePhotoAutosave';
import { PhotoDetailsEditor } from './PhotoDetailsEditor';
import type { Photo } from '../types';

type PhotoLightboxProps = {
  photo: Photo;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  canEdit: boolean;
  draftFor: (photo: Photo) => PhotoDraft;
  onSave: (photoId: string, draft: PhotoDraft, changes: Partial<PhotoDraft>) => Promise<boolean>;
};

export function PhotoLightbox({ photo, onClose, onNext, onPrev, canEdit, draftFor, onSave }: PhotoLightboxProps) {
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
          <p className="owner-badge">Note</p>
          {canEdit ? (
            // The key gives each photo its own editor, whose unmount saves the pending edit.
            <PhotoDetailsEditor
              key={photo.id}
              photo={photo}
              initialDraft={draftFor(photo)}
              onSave={(draft, changes) => onSave(photo.id, draft, changes)}
            />
          ) : (
            <>
              <h2>{photo.title}</h2>
              <p>A note from the owner.</p>
              <div className="public-note">{photo.note.trim() || 'No note added for this photo yet.'}</div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
