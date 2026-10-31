import { render, screen } from '@testing-library/react';
import { PhotoGrid } from './PhotoGrid';
import type { Photo } from '../types';

vi.mock('../lib/supabase', () => ({ supabase: {} }));

const photos = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, title: id, width: 100, height: 100 }) as Photo);

function renderGrid() {
  render(
    <PhotoGrid
      photos={photos}
      desktopColumns={4}
      className="masonry-grid"
      renderPhoto={(photo) => <button type="button">{photo.title}</button>}
    />,
  );
  return screen.getAllByRole('button');
}

const cellOf = (tile: HTMLElement) => tile.parentElement as HTMLElement;

describe('PhotoGrid', () => {
  it('keeps the DOM, and so the Tab order, in photo order', () => {
    expect(renderGrid().map((tile) => tile.textContent)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('gives each cell its place from the placement', () => {
    const tiles = renderGrid();

    expect(tiles.map((tile) => cellOf(tile).style.getPropertyValue('--cell-column'))).toEqual(['0', '1', '2', '3', '0']);
    expect(cellOf(tiles[4]).style.getPropertyValue('--cell-top')).toBe('calc(1 * var(--column-width) + 1 * var(--grid-gap))');
  });

  it('makes the grid as tall as its tallest column', () => {
    renderGrid();
    const grid = document.querySelector<HTMLElement>('.photo-grid');

    expect(grid?.style.getPropertyValue('--grid-columns')).toBe('4');
    expect(grid?.style.getPropertyValue('--grid-height')).toContain('calc(2 * var(--column-width) + 2 * var(--grid-gap))');
  });
});
