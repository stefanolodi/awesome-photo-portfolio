import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { useColumnCount } from '../hooks/useColumnCount';
import { placePhotos, type ColumnEnd } from '../lib/placePhotos';
import type { Photo } from '../types';

type PhotoGridProps = {
  photos: Photo[];
  desktopColumns: number;
  className: string;
  renderPhoto: (photo: Photo) => ReactNode;
};

const offset = ({ height, photos }: ColumnEnd) => `calc(${height} * var(--column-width) + ${photos} * var(--grid-gap))`;

// Each cell takes its size from the photo's stored ratio, never from the loaded image, so a photo with no stored
// dimensions cannot overflow onto the tile below it. The DOM stays in photo order, so Tab and screen readers follow it.
export function PhotoGrid({ photos, desktopColumns, className, renderPhoto }: PhotoGridProps) {
  const columns = useColumnCount(desktopColumns);
  const { cells, columnEnds } = useMemo(() => placePhotos(photos, columns), [photos, columns]);
  const gridStyle = { '--grid-columns': columns, '--grid-height': `max(${columnEnds.map(offset).join(', ')})` } as CSSProperties;

  return (
    <div className={`photo-grid ${className}`} style={gridStyle}>
      {cells.map(({ photo, column, ratio, above }) => (
        <div
          className="photo-grid-cell"
          key={photo.id}
          style={{ '--cell-column': column, '--cell-ratio': ratio, '--cell-top': offset(above) } as CSSProperties}
        >
          {renderPhoto(photo)}
        </div>
      ))}
    </div>
  );
}
