import { photoSrc, photoSrcSet } from '../lib/photoSrc';
import type { GridSizes } from '../lib/photoSizes';
import { setImageFallback } from '../lib/setImageFallback';
import type { Photo } from '../types';

type PhotoGridImageProps = { photo: Photo; grid: GridSizes };

// width and height let the browser reserve the tile's space before the image loads, so the CSS columns don't rebalance
// under the smooth scroll as each image arrives.
export function PhotoGridImage({ photo, grid }: PhotoGridImageProps) {
  return (
    <img
      alt={photo.title}
      src={photoSrc(photo.src, grid.widths[0])}
      srcSet={photoSrcSet(photo.src, grid.widths)}
      sizes={grid.sizes}
      width={photo.width}
      height={photo.height}
      loading="lazy"
      decoding="async"
      onError={(e) => setImageFallback(e, photo.title)}
    />
  );
}
