import { useEffect, useState } from 'react';
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
import { AlbumForm } from '../components/AlbumForm';
import { PhotoUpload } from '../components/PhotoUpload';
import { PhotoEditModal } from '../components/PhotoEditModal';
import { PhotoLightbox } from '../components/PhotoLightbox';
import { PhotoTile } from '../components/PhotoTile';
import { setImageFallback } from '../lib/setImageFallback';
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
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

  const photos = album?.photos ?? [];
  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId) ?? null;

  const moveSelection = (direction: 'next' | 'prev') => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    if (currentIndex < 0) return;
    const step = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + step + photos.length) % photos.length;
    setSelectedPhotoId(photos[nextIndex]?.id ?? null);
  };

  useEffect(() => {
    if (!selectedPhotoId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPhotoId(null);
      if (event.key === 'ArrowRight') moveSelection('next');
      if (event.key === 'ArrowLeft') moveSelection('prev');
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedPhotoId, selectedPhoto, photos]);

  const handlePhotoDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !album) return;
    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(photos, oldIndex, newIndex);
    reorderPhotos.mutate(reordered.map((p, i) => ({ id: p.id, display_order: i })));
  };

  const handleNoteChange = (photoId: string, note: string) => {
    if (!album) return;
    updatePhoto.mutate({ id: photoId, albumId: album.id, note });
  };

  const toggleAlbumPrivacy = () => {
    if (!album) return;
    updateAlbum.mutate({ id: album.id, isPrivate: !album.isPrivate });
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
          <h1>Private gallery</h1>
          <p>This gallery is only visible to the owner.</p>
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

      <section className="album-hero opening-hero fade-in-up">
        <img alt={album.title} src={album.cover} onError={(e) => setImageFallback(e, album.title)} />
        <div className="hero-layer" />
        <div className="hero-copy">
          <p>{new Date(album.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1>{album.title}</h1>
          <p>{album.description}</p>
          {isOwner && (
            <button className="privacy-toggle" onClick={toggleAlbumPrivacy} type="button">
              {album.isPrivate ? 'Private gallery' : 'Public gallery'}
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
                    onDelete={() => deletePhoto.mutate({ id: photo.id, albumId: album.id, publicId: photo.publicId })}
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
          onNoteChange={handleNoteChange}
          canEdit={isOwner}
          onEditPhoto={isOwner ? () => setEditingPhoto(selectedPhoto) : undefined}
        />
      )}

      {showUpload && <PhotoUpload albumId={album.id} onDone={() => setShowUpload(false)} onClose={() => setShowUpload(false)} />}
      {showEditAlbum && <AlbumForm album={album} onClose={() => setShowEditAlbum(false)} />}
      {editingPhoto && album && (
        <PhotoEditModal photo={editingPhoto} albumId={album.id} onClose={() => setEditingPhoto(null)} />
      )}
    </main>
  );
}
