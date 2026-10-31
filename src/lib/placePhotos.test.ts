import { describe, expect, it } from 'vitest';
import type { Photo } from '../types';
import { placePhotos } from './placePhotos';

function photo(id: string, width?: number, height?: number) {
  return { id, width, height } as Photo;
}

const columnsOf = (photos: Photo[], columns: number) => placePhotos(photos, columns).cells.map((cell) => cell.column);

describe('placePhotos', () => {
  it('fills the first row left to right in photo order', () => {
    const photos = [photo('a', 200, 300), photo('b', 300, 200), photo('c', 100, 100), photo('d', 100, 400)];

    expect(columnsOf(photos, 4)).toEqual([0, 1, 2, 3]);
  });

  it('puts each later photo into the shortest column', () => {
    const tall = photo('tall', 100, 400);
    const wide = photo('wide', 400, 100);

    expect(columnsOf([tall, wide, wide, wide], 2)).toEqual([0, 1, 1, 1]);
  });

  it('breaks a tie towards the leftmost column', () => {
    const square = photo('square', 100, 100);

    expect(columnsOf([square, square, square, square, square], 2)).toEqual([0, 1, 0, 1, 0]);
  });

  it('treats columns as tied when only rounding separates their heights', () => {
    const photos = [photo('a', 10, 1), photo('b', 10, 3), photo('c', 5, 1), photo('next', 1, 1)];

    expect(columnsOf(photos, 2)).toEqual([0, 1, 0, 0]);
  });

  it('places a photo with missing dimensions as a 3:2 landscape photo', () => {
    const { cells, columnEnds } = placePhotos([photo('none'), photo('zero', 0, 0)], 1);

    expect(cells.map((cell) => cell.ratio)).toEqual([3 / 2, 3 / 2]);
    expect(columnEnds[0].height).toBeCloseTo(4 / 3);
  });

  it('records what sits above each photo and where each column ends', () => {
    const { cells, columnEnds } = placePhotos([photo('a', 100, 200), photo('b', 100, 100), photo('c', 100, 300)], 2);

    expect(cells[2]).toMatchObject({ column: 1, above: { height: 1, photos: 1 } });
    expect(columnEnds).toEqual([{ height: 2, photos: 1 }, { height: 4, photos: 2 }]);
  });

  it('leaves existing photos where they are when a new photo goes at the end', () => {
    const photos = [photo('a', 200, 300), photo('b', 300, 200), photo('c', 100, 100), photo('d', 100, 400)];
    const before = placePhotos(photos, 3).cells;
    const after = placePhotos([...photos, photo('new', 300, 200)], 3).cells;

    expect(after.slice(0, -1)).toEqual(before);
  });

  it('places nothing for an empty album', () => {
    expect(placePhotos([], 2)).toEqual({ cells: [], columnEnds: [{ height: 0, photos: 0 }, { height: 0, photos: 0 }] });
  });
});
