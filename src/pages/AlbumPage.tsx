import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '../hooks/useAuth';
import { useAlbum, useUpdateAlbum } from '../hooks/useAlbums';
import { useReorderPhotos, useUpdatePhoto, useDeletePhoto } from '../hooks/usePhotos';
import type { ThemeProps } from '../hooks/useTheme';
import type { PhotoDraft } from '../hooks/usePhotoAutosave';
import { ActionError } from '../components/ActionError';
import { AlbumForm } from '../components/AlbumForm';
import { PhotoUpload } from '../components/PhotoUpload';
import { PhotoLightbox } from '../components/PhotoLightbox';
import { PhotoTile } from '../components/PhotoTile';
import { setImageFallback } from '../lib/setImageFallback';
import { stepPhotoId } from '../lib/stepPhotoId';
import type { Photo } from '../types';

export function AlbumPage({ theme, onToggleTheme }: ThemeProps) {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const { data: album, isLoading } = useAlbum(albumId ?? '');
  const updateAlbum = useUpdateAlbum();
  const reorderPhotos = useReorderPhotos(albumId ?? '');
  const updatePhoto = useUpdatePhoto();
  const deletePhoto = useDeletePhoto();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showEditAlbum, setShowEditAlbum] = useState(false);
  const [actionError, setActionError] = useState('');
  // Drafts whose last save failed, so reopening the photo shows the owner's text again.
  const unsavedDrafts = useRef(new Map<string, PhotoDraft>());

  const photos = useMemo(() => album?.photos ?? [], [album]);
  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId) ?? null;

  const moveSelection = (direction: 'next' | 'prev') => {
    setSelectedPhotoId((currentId) => stepPhotoId(photos, currentId, direction));
  };

  useEffect(() => {
    if (!selectedPhotoId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // In the title or note field, arrows move the text cursor and Escape only leaves the field.
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'Escape') setSelectedPhotoId(null);
      if (event.key === 'ArrowRight') setSelectedPhotoId((currentId) => stepPhotoId(photos, currentId, 'next'));
      if (event.key === 'ArrowLeft') setSelectedPhotoId((currentId) => stepPhotoId(photos, currentId, 'prev'));
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedPhotoId, photos]);

  const handlePhotoDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !album) return;
    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(photos, oldIndex, newIndex);
    reorderPhotos.mutate(reordered.map((p, i) => ({ id: p.id, display_order: i })), {
      onError: () => setActionError('The new photo order could not be saved. Try again.'),
    });
  };

  const draftFor = (photo: Photo): PhotoDraft =>
    unsavedDrafts.current.get(photo.id) ?? { title: photo.title, note: photo.note };

  const savePhoto = async (photoId: string, draft: PhotoDraft, changes: Partial<PhotoDraft>) => {
    if (!album) return false;
    unsavedDrafts.current.set(photoId, draft);
    try {
      await updatePhoto.mutateAsync({ id: photoId, albumId: album.id, ...changes });
      if (unsavedDrafts.current.get(photoId) === draft) unsavedDrafts.current.delete(photoId);
      return true;
    } catch {
      setActionError('The note could not be saved. Try again.');
      return false;
    }
  };

  const deleteAlbumPhoto = (photo: Photo) => {
    if (!album) return;
    deletePhoto.mutate({ id: photo.id, albumId: album.id, publicId: photo.publicId }, {
      onError: () => setActionError('The photo could not be deleted. Try again.'),
    });
  };

  const toggleAlbumPrivacy = () => {
    if (!album) return;
    const message = album.isPrivate
      ? 'The album could not be made public, so it is still private. Try again.'
      : 'The album could not be made private, so it is still public. Try again.';
    updateAlbum.mutate({ id: album.id, isPrivate: !album.isPrivate }, {
      onError: () => setActionError(message),
    });
  };

  if (isLoading) return <main className="shell" />;

  if (!album) {
    return (
      <main className="shell">
        <p>Album not found.</p>
        <button className="nav-item" onClick={() => void navigate('/')} type="button">Back home</button>
      </main>
    );
  }

  if (!isOwner && album.isPrivate) {
    return (
      <main className="shell album-shell">
        <ThemeToggle
          className="fixed right-5 top-4 z-30"
          isDark={theme === 'dark'}
          onToggle={(nextIsDark) => { if ((nextIsDark ? 'dark' : 'light') !== theme) onToggleTheme(); }}
        />
        <button className="back-link" type="button" onClick={() => void navigate('/')}>Back to albums</button>
        <section className="gallery-wrap">
          <h1>Private album</h1>
          <p>This album is only visible to the owner.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell album-shell">
      <ThemeToggle
        className="fixed right-5 top-4 z-30"
        isDark={theme === 'dark'}
        onToggle={(nextIsDark) => { if ((nextIsDark ? 'dark' : 'light') !== theme) onToggleTheme(); }}
      />
      <button className="back-link" type="button" onClick={() => void navigate('/')}>Back to albums</button>
      <ActionError message={actionError} onDismiss={() => setActionError('')} />

      <section className="album-hero opening-hero fade-in-up">
        <img alt={album.title} src={album.cover} onError={(e) => setImageFallback(e, album.title)} />
        <div className="hero-layer" />
        <div className="hero-copy">
          <p>{new Date(album.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1>{album.title}</h1>
          <p>{album.description}</p>
          {isOwner && (
            <button className="privacy-toggle" onClick={toggleAlbumPrivacy} type="button">
              {album.isPrivate ? 'Private album' : 'Public album'}
            </button>
          )}
        </div>
      </section>

      <section className="album-content fade-in-up delay-1">
        {isOwner ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhotoDragEnd}>
            <SortableContext items={photos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="masonry-grid">
                {photos.map((photo) => (
                  <PhotoTile
                    key={photo.id}
                    photo={photo}
                    isActive={selectedPhoto?.id === photo.id}
                    onSelect={() => setSelectedPhotoId(photo.id)}
                    onDelete={() => deleteAlbumPhoto(photo)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="masonry-grid">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                className={selectedPhoto?.id === photo.id ? 'photo-tile is-active' : 'photo-tile'}
                onClick={() => setSelectedPhotoId(photo.id)}
              >
                <img alt={photo.title} src={photo.src} loading="lazy" onError={(e) => setImageFallback(e, photo.title)} />
              </button>
            ))}
          </div>
        )}

      </section>

      {isOwner && (
        <div className="owner-toolbar">
          <button
            type="button"
            className="owner-toolbar-btn is-primary"
            onClick={() => setShowUpload(true)}
          >
            ↑ Upload photos
          </button>
          <button
            type="button"
            className="owner-toolbar-btn is-secondary"
            onClick={() => setShowEditAlbum(true)}
          >
            Edit album
          </button>
        </div>
      )}

      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhotoId(null)}
          onNext={() => moveSelection('next')}
          onPrev={() => moveSelection('prev')}
          canEdit={isOwner}
          draftFor={draftFor}
          onSave={savePhoto}
        />
      )}

      {showUpload && <PhotoUpload albumId={album.id} onDone={() => setShowUpload(false)} onClose={() => setShowUpload(false)} />}
      {showEditAlbum && <AlbumForm album={album} onClose={() => setShowEditAlbum(false)} />}
    </main>
  );
}
