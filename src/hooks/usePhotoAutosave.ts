import { useCallback, useEffect, useRef, useState } from 'react';
import type { Photo } from '../types';

export type PhotoDraft = { title: string; note: string };
export type SaveStatus = 'idle' | 'saving' | 'saved';

/** Resolves true when the save reached the database. */
export type SavePhotoDraft = (draft: PhotoDraft, changes: Partial<PhotoDraft>) => Promise<boolean>;

const AUTOSAVE_DELAY_MS = 800;

// An empty title is never sent, so a cleared title cannot reach the database.
function changesToSave(draft: PhotoDraft, saved: PhotoDraft): Partial<PhotoDraft> | null {
  const changes: Partial<PhotoDraft> = {};
  if (draft.title.trim() && draft.title !== saved.title) changes.title = draft.title;
  if (draft.note !== saved.note) changes.note = draft.note;
  return Object.keys(changes).length > 0 ? changes : null;
}

export function usePhotoAutosave(photo: Photo, initialDraft: PhotoDraft, save: SavePhotoDraft) {
  const [draft, setDraft] = useState(initialDraft);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const draftRef = useRef(initialDraft);
  const savedRef = useRef<PhotoDraft>({ title: photo.title, note: photo.note });
  const saveRef = useRef(save);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);

  useEffect(() => {
    saveRef.current = save;
  });

  // One save at a time, so an older response never lands after a newer one.
  // An edit made while a save is in flight goes out once that save succeeds.
  const flush = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    try {
      for (;;) {
        queuedRef.current = false;
        const current = draftRef.current;
        const changes = changesToSave(current, savedRef.current);
        if (!changes) break;
        setStatus('saving');
        const ok = await saveRef.current(current, changes);
        if (!ok) {
          setStatus('idle');
          break;
        }
        savedRef.current = { ...savedRef.current, ...changes };
        setStatus('saved');
        if (!queuedRef.current) break;
      }
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  // Closing the lightbox or moving to another photo unmounts the editor, so the
  // pending edit goes out here.
  useEffect(() => () => void flush(), [flush]);

  const setField = (field: keyof PhotoDraft, value: string) => {
    const next = { ...draftRef.current, [field]: value };
    draftRef.current = next;
    setDraft(next);
  };

  const edit = (field: keyof PhotoDraft, value: string) => {
    setField(field, value);
    setStatus((current) => (current === 'saved' ? 'idle' : current));
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
  };

  const leaveTitle = () => {
    if (!draftRef.current.title.trim()) setField('title', savedRef.current.title);
    void flush();
  };

  return {
    draft,
    status,
    editTitle: (value: string) => edit('title', value),
    editNote: (value: string) => edit('note', value),
    leaveTitle,
    leaveNote: () => void flush(),
  };
}
