import type { KeyboardEvent } from 'react';
import { usePhotoAutosave, type PhotoDraft, type SavePhotoDraft } from '../hooks/usePhotoAutosave';
import type { Photo } from '../types';

type PhotoDetailsEditorProps = { photo: Photo; initialDraft: PhotoDraft; onSave: SavePhotoDraft };

const statusText = { idle: '', saving: 'Saving…', saved: 'Saved' } as const;

// Escape leaves the field, and the blur saves. The lightbox ignores keys aimed at a field,
// so this Escape does not close it.
function leaveOnEscape(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (event.key === 'Escape') event.currentTarget.blur();
}

export function PhotoDetailsEditor({ photo, initialDraft, onSave }: PhotoDetailsEditorProps) {
  const { draft, status, editTitle, editNote, leaveTitle, leaveNote } = usePhotoAutosave(photo, initialDraft, onSave);

  return (
    <>
      <input
        className="lightbox-title-input"
        type="text"
        aria-label="Title"
        value={draft.title}
        onChange={(e) => editTitle(e.target.value)}
        onBlur={leaveTitle}
        onKeyDown={leaveOnEscape}
      />
      <p>Guests see this note when the album is public.</p>
      <textarea
        aria-label="Note"
        value={draft.note}
        onChange={(e) => editNote(e.target.value)}
        onBlur={leaveNote}
        onKeyDown={leaveOnEscape}
        placeholder="Write a note…"
        rows={8}
      />
      <p className="lightbox-save-status" role="status">{statusText[status]}</p>
    </>
  );
}
