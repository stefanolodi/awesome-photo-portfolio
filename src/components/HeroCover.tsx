import { coverCrops } from '../lib/coverCrops';
import { coverSrc } from '../lib/coverSrc';
import { setImageFallback } from '../lib/setImageFallback';

export function HeroCover({ cover, title }: { cover: string; title: string }) {
  return (
    <picture>
      {coverCrops.hero.sources.map((crop) => (
        <source key={crop.media} media={crop.media} srcSet={coverSrc(cover, crop)} />
      ))}
      <img alt={title} src={coverSrc(cover, coverCrops.hero.fallback)} onError={(e) => setImageFallback(e, title)} />
    </picture>
  );
}
