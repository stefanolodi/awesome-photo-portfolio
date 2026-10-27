export type GridSizes = { widths: readonly number[]; sizes: string };

// Each width is a derived image that counts against the Cloudinary transformation quota, so the lists stay short.
// The sizes follow the column counts in styles.css. The page is full width, so a column is a share of the viewport.
export const photoSizes: { masonry: GridSizes; feed: GridSizes; lightbox: number } = {
  // 4 columns, then 3 below 1024px, then 2 below 760px. 600 covers a column at 1x and 1200 at 2x.
  masonry: { widths: [600, 1200], sizes: '(max-width: 760px) 50vw, (max-width: 1024px) 33vw, 25vw' },
  // 5 columns, then 3 below 1024px, then 2 below 760px.
  feed: { widths: [600, 1200], sizes: '(max-width: 760px) 50vw, (max-width: 1024px) 33vw, 20vw' },
  // The lightbox card is at most 1500px wide, so 2400 stays sharp on a 2x screen without loading the original.
  lightbox: 2400,
};
