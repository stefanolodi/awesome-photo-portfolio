import { useSyncExternalStore } from 'react';

const QUERIES = ['(max-width: 760px)', '(max-width: 1024px)'];
const COUNTS_BELOW_DESKTOP = [2, 3];

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((query) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener('change', onChange));
  return () => lists.forEach((list) => list.removeEventListener('change', onChange));
}

export function useColumnCount(desktopColumns: number): number {
  return useSyncExternalStore(subscribe, () => {
    const matched = QUERIES.findIndex((query) => window.matchMedia(query).matches);
    return matched === -1 ? desktopColumns : COUNTS_BELOW_DESKTOP[matched];
  });
}
