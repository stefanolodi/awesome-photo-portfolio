import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { setImageFallback } from '../lib/setImageFallback';
import type { Album } from '../types';

export function GallerySliderCard({ album, showPrivacy }: { album: Album; showPrivacy: boolean }) {
  return (
    <Link className="album-card album-card-link" to={`/album/${album.id}`}>
      <div className="cover-frame">
        <img alt={album.title} src={album.cover} loading="lazy" onError={(e) => setImageFallback(e, album.title)} />
        <div className="cover-overlay" />
        {showPrivacy && album.isPrivate && (
          <span className="privacy-lock" aria-label="Private album" title="Private album">
            <Lock size={14} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="album-meta">
        <p>{new Date(album.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        <h2>{album.title}</h2>
        <span aria-hidden="true" className="click-indicator">View album</span>
      </div>
    </Link>
  );
}
