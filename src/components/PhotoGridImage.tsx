import { photoSrc, photoSrcSet } from '../lib/photoSrc';
import type { GridSizes } from '../lib/photoSizes';
import { setImageFallback } from '../lib/setImageFallback';
import type { Photo } from '../types';

type PhotoGridImageProps = { photo: Photo; grid: GridSizes };

// PhotoGrid sizes the tile, so width and height only give the browser the image's ratio before it loads.
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
