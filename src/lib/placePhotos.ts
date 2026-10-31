import { photoAspectRatio } from './photoAspectRatio';
import type { Photo } from '../types';

const FALLBACK_RATIO = 3 / 2;
// Heights are sums of fractions, so two columns that tie can differ in the last digits.
const TIE_TOLERANCE = 1e-9;

// Heights count column widths, so a placement holds at every window width within a column count.
export type ColumnEnd = { height: number; photos: number };
export type PhotoCell = { photo: Photo; column: number; ratio: number; above: ColumnEnd };
export type PhotoPlacement = { cells: PhotoCell[]; columnEnds: ColumnEnd[] };

function shortestColumn(columnEnds: ColumnEnd[]): number {
  return columnEnds.reduce(
    (shortest, end, column) => (end.height < columnEnds[shortest].height - TIE_TOLERANCE ? column : shortest),
    0,
  );
}

export function placePhotos(photos: Photo[], columns: number): PhotoPlacement {
  const columnEnds: ColumnEnd[] = Array.from({ length: columns }, () => ({ height: 0, photos: 0 }));
  const cells = photos.map((photo) => {
    const column = shortestColumn(columnEnds);
    const ratio = photoAspectRatio(photo) ?? FALLBACK_RATIO;
    const above = columnEnds[column];
    columnEnds[column] = { height: above.height + 1 / ratio, photos: above.photos + 1 };
    return { photo, column, ratio, above };
  });
  return { cells, columnEnds };
}
