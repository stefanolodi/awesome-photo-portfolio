import { swipeStep } from './swipeStep';

const start = { x: 200, y: 200 };

describe('swipeStep', () => {
  it('reads a swipe left as next and a swipe right as previous', () => {
    expect(swipeStep(start, { x: 100, y: 200 })).toBe('next');
    expect(swipeStep(start, { x: 300, y: 200 })).toBe('prev');
  });

  it('steps at exactly 50px and not below', () => {
    expect(swipeStep(start, { x: 150, y: 200 })).toBe('next');
    expect(swipeStep(start, { x: 250, y: 200 })).toBe('prev');
    expect(swipeStep(start, { x: 151, y: 200 })).toBeNull();
    expect(swipeStep(start, { x: 249, y: 200 })).toBeNull();
  });

  it('ignores a swipe that moves at least as far vertically as sideways', () => {
    expect(swipeStep(start, { x: 100, y: 320 })).toBeNull();
    expect(swipeStep(start, { x: 100, y: 100 })).toBeNull();
  });

  it('accepts a diagonal swipe that is more sideways than vertical', () => {
    expect(swipeStep(start, { x: 100, y: 260 })).toBe('next');
  });
});
