import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '../hooks/useAuth';
import { useAlbums, useReorderAlbums } from '../hooks/useAlbums';
import type { ThemeProps } from '../hooks/useTheme';
import { AlbumForm } from '../components/AlbumForm';
import { AlbumCard } from '../components/AlbumCard';
import { GallerySliderCard } from '../components/GallerySliderCard';
import { OwnerSessionButton } from '../components/OwnerSessionButton';
import { setImageFallback } from '../lib/setImageFallback';
import type { Album } from '../types';

type HomeView = 'galleries' | 'photos' | number;

export function HomePage({ theme, onToggleTheme }: ThemeProps) {
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
