import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { setImageFallback } from '../lib/setImageFallback';
import type { Photo } from '../types';

type PhotoTileProps = { photo: Photo; isActive: boolean; onSelect: () => void; onDelete?: () => void };

export function PhotoTile({ photo, isActive, onSelect, onDelete }: PhotoTileProps) {
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
