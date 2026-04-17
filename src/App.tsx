import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lock, Trash2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSmoothScroll } from './useSmoothScroll';
import { useAuth } from './hooks/useAuth';
import { useAlbums, useAlbum, useReorderAlbums, useUpdateAlbum } from './hooks/useAlbums';
import { useReorderPhotos, useUpdatePhoto, useDeletePhoto } from './hooks/usePhotos';
import { AlbumForm } from './components/AlbumForm';
import { PhotoUpload } from './components/PhotoUpload';
import { PhotoEditModal } from './components/PhotoEditModal';
import { LoginPage } from './pages/LoginPage';
import type { Album, Photo } from './types';

type Theme = 'light' | 'dark';

const setImageFallback = (event: React.SyntheticEvent<HTMLImageElement>, label: string) => {
  const target = event.currentTarget;
  target.onerror = null;
  target.src = `https://placehold.co/1200x900/D4A373/1F1E1C?text=${encodeURIComponent(label)}`;
};

export function App() {
  useSmoothScroll();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem('penny-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('penny-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={<HomePage theme={theme} onToggleTheme={toggleTheme} />}
      />
      <Route
        path="/album/:albumId"
        element={<AlbumPage theme={theme} onToggleTheme={toggleTheme} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

type ThemeProps = { theme: Theme; onToggleTheme: () => void };
type HomeView = 'galleries' | 'photos' | number;

function HomePage({ theme, onToggleTheme }: ThemeProps) {
  const { isOwner } = useAuth();
  const { data: albums = [] as Album[], isLoading } = useAlbums();
  const reorderAlbums = useReorderAlbums();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [activeView, setActiveView] = useState<HomeView>('galleries');
  const [isFilterAnimating, setIsFilterAnimating] = useState(false);
  const [showAlbumForm, setShowAlbumForm] = useState(false);

  const accessibleAlbums = useMemo(
    () => (isOwner ? albums : albums.filter((a) => !a.isPrivate)),
    [albums, isOwner]
  );

  const years = useMemo(
    () => Array.from(new Set(accessibleAlbums.map((a) => a.year))).sort((a, b) => b - a),
    [accessibleAlbums]
  );

  const featuredAlbum = accessibleAlbums[0];
  const visibleAlbums = useMemo(() => {
    if (typeof activeView === 'number') return accessibleAlbums.filter((a) => a.year === activeView);
    return accessibleAlbums;
  }, [activeView, accessibleAlbums]);

  const allPhotos = useMemo(
    () =>
      accessibleAlbums
        .flatMap((album) => album.photos.map((photo, index) => ({ photo, album, index })))
        .sort((a, b) => {
          if (a.album.eventDate !== b.album.eventDate) return b.album.eventDate.localeCompare(a.album.eventDate);
          return b.index - a.index;
        }),
    [accessibleAlbums]
  );

  useEffect(() => {
    setIsFilterAnimating(true);
    let rafB = 0;
    const rafA = window.requestAnimationFrame(() => {
      rafB = window.requestAnimationFrame(() => setIsFilterAnimating(false));
    });
    return () => {
      window.cancelAnimationFrame(rafA);
      if (rafB) window.cancelAnimationFrame(rafB);
    };
  }, [activeView]);

  const scrollLockRef = useRef<number | null>(null);

  useEffect(() => {
    const y = scrollLockRef.current;
    if (y === null) return;
    scrollLockRef.current = null;
    if (window.__lenis) {
      window.__lenis.scrollTo(y, { immediate: true });
    } else {
      window.scrollTo({ top: y });
    }
  }, [activeView]);

  const setViewWithStableScroll = (nextView: HomeView) => {
    if (nextView === activeView) return;
    scrollLockRef.current = window.__lenis?.scroll ?? window.scrollY;
    setActiveView(nextView);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = albums.findIndex((a) => a.id === active.id);
    const newIndex = albums.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(albums, oldIndex, newIndex);
    reorderAlbums.mutate(reordered.map((a, i) => ({ id: a.id, display_order: i })));
  };

  const scrollToGalleries = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (window.__lenis) {
      window.__lenis.scrollTo('#home-galleries', { offset: -20, duration: 1.25 });
      return;
    }
    document.getElementById('home-galleries')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) return <main className="shell" />;

  return (
    <main className="shell shell-home">
      <ThemeToggle
        className="fixed right-5 top-4 z-30"
        isDark={theme === 'dark'}
        onToggle={(nextIsDark) => { if ((nextIsDark ? 'dark' : 'light') !== theme) onToggleTheme(); }}
      />

      {!isOwner && (
        <Link to="/login" className="view-toggle" style={{ textDecoration: 'none' }}>
          Owner login
        </Link>
      )}
      {isOwner && (
        <OwnerSessionButton />
      )}

      {featuredAlbum && (
        <section className="opening-hero fade-in-up">
          <img alt={featuredAlbum.title} src={featuredAlbum.cover} onError={(e) => setImageFallback(e, featuredAlbum.title)} />
          <div className="hero-layer" />
          <div className="hero-copy">
            <p className="eyebrow">Private Photo Archive</p>
            <h1>{featuredAlbum.title}</h1>
            <p>{featuredAlbum.description}</p>
            <Link className="view-link hero-link" to={`/album/${featuredAlbum.id}`}>Open featured album</Link>
          </div>
          <a className="scroll-hint" href="#home-galleries" onClick={scrollToGalleries}>Scroll to see galleries</a>
        </section>
      )}

      <section className="gallery-wrap fade-in-up delay-1" id="home-galleries">
        <nav className="year-filter-bar" aria-label="Year filters">
          <button
            className={activeView === 'galleries' ? 'nav-item is-active' : 'nav-item'}
            onClick={() => setViewWithStableScroll('galleries')}
            type="button"
          >
            Galleries
          </button>
          {years.map((year) => (
            <button
              className={activeView === year ? 'nav-item is-active' : 'nav-item'}
              key={year}
              onClick={() => setViewWithStableScroll(year)}
              type="button"
            >
              {year}
            </button>
          ))}
          <button
            className={activeView === 'photos' ? 'nav-item is-active' : 'nav-item'}
            onClick={() => setViewWithStableScroll('photos')}
            type="button"
          >
            All Photos
          </button>
        </nav>

        {isOwner && (
          <div className="home-owner-bar">
            <button type="button" className="owner-toolbar-btn is-primary" onClick={() => setShowAlbumForm(true)}>
              + New album
            </button>
          </div>
        )}

        <div className={isFilterAnimating ? 'filter-content-transition is-entering' : 'filter-content-transition'}>
          {activeView === 'photos' ? (
            <div className="photo-feed">
              {allPhotos.map(({ photo, album, index }) => (
                <article className="photo-feed-item" key={`${album.id}-${photo.id}-${index}`}>
                  <img alt={photo.title} src={photo.src} loading="lazy" onError={(e) => setImageFallback(e, photo.title)} />
                </article>
              ))}
            </div>
          ) : activeView === 'galleries' && isOwner ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleAlbums.map((a) => a.id)} strategy={rectSortingStrategy}>
                <div className="albums-grid">
                  {visibleAlbums.map((album) => (
                    <div className="album-slide" key={album.id}>
                      <AlbumCard album={album} showPrivacy />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="albums-grid">
              {visibleAlbums.map((album) => (
                <div className="album-slide" key={album.id}>
                  <GallerySliderCard album={album} showPrivacy={isOwner} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showAlbumForm && <AlbumForm onClose={() => setShowAlbumForm(false)} />}
    </main>
  );
}

function OwnerSessionButton() {
  const { signOut } = useAuth();
  return (
    <button className="view-toggle" onClick={signOut} type="button">
      Sign out
    </button>
  );
}

function AlbumCard({ album, showPrivacy }: { album: Album; showPrivacy: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: album.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.8 : 1 };

  return (
    <article className="album-card" ref={setNodeRef} style={style}>
      <div className="cover-frame" {...attributes} {...listeners}>
        <img alt={album.title} src={album.cover} loading="lazy" onError={(e) => setImageFallback(e, album.title)} />
        <div className="cover-overlay" />
        {showPrivacy && album.isPrivate && (
          <span className="privacy-lock" aria-label="Private gallery" title="Private gallery">
            <Lock size={14} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="album-meta">
        <p>{new Date(album.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        <h2>{album.title}</h2>
        <Link className="view-link card-inline-link" to={`/album/${album.id}`}>View gallery</Link>
      </div>
    </article>
  );
}

function GallerySliderCard({ album, showPrivacy }: { album: Album; showPrivacy: boolean }) {
  return (
    <Link className="album-card album-card-link" to={`/album/${album.id}`}>
      <div className="cover-frame">
        <img alt={album.title} src={album.cover} loading="lazy" onError={(e) => setImageFallback(e, album.title)} />
        <div className="cover-overlay" />
        {showPrivacy && album.isPrivate && (
          <span className="privacy-lock" aria-label="Private gallery" title="Private gallery">
            <Lock size={14} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="album-meta">
        <p>{new Date(album.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        <h2>{album.title}</h2>
        <span aria-hidden="true" className="click-indicator">View gallery</span>
      </div>
    </Link>
  );
}

function AlbumPage({ theme, onToggleTheme }: ThemeProps) {
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
        <button className="nav-item" onClick={() => navigate('/')} type="button">Back home</button>
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
        <button className="back-link" type="button" onClick={() => navigate('/')}>Back to albums</button>
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
      <button className="back-link" type="button" onClick={() => navigate('/')}>Back to albums</button>

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

type PhotoTileProps = { photo: Photo; isActive: boolean; onSelect: () => void; onDelete?: () => void };

function PhotoTile({ photo, isActive, onSelect, onDelete }: PhotoTileProps) {
  const [confirming, setConfirming] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const wrapStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.65 : 1 };

  return (
    <div
      className="photo-tile-wrap"
      ref={setNodeRef}
      style={wrapStyle}
      onMouseLeave={() => setConfirming(false)}
    >
      <button
        type="button"
        className={isActive ? 'photo-tile is-active' : 'photo-tile'}
        onClick={onSelect}
        {...attributes}
        {...listeners}
      >
        <img alt={photo.title} src={photo.src} loading="lazy" onError={(e) => setImageFallback(e, photo.title)} />
      </button>

      {onDelete && (
        <div className={confirming ? 'photo-delete-zone is-confirming' : 'photo-delete-zone'}>
          {confirming ? (
            <div className="photo-delete-confirm">
              <span>Delete?</span>
              <button
                type="button"
                aria-label="Confirm delete"
                onClick={(e) => { e.stopPropagation(); onDelete(); setConfirming(false); }}
              >✓</button>
              <button
                type="button"
                aria-label="Cancel delete"
                onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              >✗</button>
            </div>
          ) : (
            <button
              type="button"
              className="photo-delete-btn"
              aria-label="Delete photo"
              onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            >
              <Trash2 size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type PhotoLightboxProps = {
  photo: Photo;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onNoteChange: (photoId: string, note: string) => void;
  canEdit: boolean;
  onEditPhoto?: () => void;
};

function PhotoLightbox({ photo, onClose, onNext, onPrev, onNoteChange, canEdit, onEditPhoto }: PhotoLightboxProps) {
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
