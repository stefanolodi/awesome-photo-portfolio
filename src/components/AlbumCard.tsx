import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lock } from 'lucide-react';
import { setImageFallback } from '../lib/setImageFallback';
import type { Album } from '../types';

export function AlbumCard({ album, showPrivacy }: { album: Album; showPrivacy: boolean }) {
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
