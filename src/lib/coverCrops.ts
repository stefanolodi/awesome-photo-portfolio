import type { CoverCrop } from './coverSrc';

type HeroCrops = { sources: (CoverCrop & { media: string })[]; fallback: CoverCrop };

// Each crop is a derived image that counts against the Cloudinary transformation quota, so the list stays short.
export const coverCrops: { card: CoverCrop; hero: HeroCrops } = {
  // The cards are 1:1 at every breakpoint and never wider than one column of about 730px.
  card: { aspectRatio: '1:1', width: 800 },
  // The hero fills the viewport, so its shape follows the viewport's. The browser takes the first source whose media matches, else the fallback.
  hero: {
    sources: [
      { media: '(min-aspect-ratio: 3/2)', aspectRatio: '16:9', width: 1920 },
      { media: '(min-aspect-ratio: 1/1)', aspectRatio: '4:3', width: 1600 },
    ],
    fallback: { aspectRatio: '9:16', width: 1080 },
  },
};
