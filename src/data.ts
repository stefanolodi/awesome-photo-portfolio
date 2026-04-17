// Seed data — not used in production. Remove once real data is in Supabase.

const unsplashBySeed = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;

const toPhoto = (albumId: string, i: number, title: string): { id: string; src: string; title: string; note: string } => ({
  id: `${albumId}-${i}`,
  src: unsplashBySeed(`${albumId}-${i}`, i % 3 === 0 ? 1200 : i % 2 === 0 ? 1200 : 900, i % 3 === 0 ? 1600 : i % 2 === 0 ? 900 : 1200),
  title,
  note: ''
});

export const albumsSeed = [
  {
    id: 'tuscany-sunset-week',
    isPrivate: false,
    year: 2026,
    title: 'Tuscany Sunset Week',
    eventDate: '2026-06-12',
    cover: unsplashBySeed('tuscany-sunset-week-cover', 1400, 900),
    description: 'Slow evenings, vineyard roads, and candle-lit dinners.',
    photos: [
      toPhoto('tuscany-sunset-week', 1, 'Golden fields'),
      toPhoto('tuscany-sunset-week', 2, 'Stone villa'),
      toPhoto('tuscany-sunset-week', 3, 'Hilltop dinner'),
      toPhoto('tuscany-sunset-week', 4, 'Balcony morning'),
      toPhoto('tuscany-sunset-week', 5, 'Road at dusk'),
      toPhoto('tuscany-sunset-week', 6, 'Warm window light'),
      toPhoto('tuscany-sunset-week', 7, 'Pasta night'),
      toPhoto('tuscany-sunset-week', 8, 'Olive grove'),
      toPhoto('tuscany-sunset-week', 9, 'Last sunset')
    ]
  },
  {
    id: 'autumn-in-lake-como',
    isPrivate: false,
    year: 2025,
    title: 'Autumn in Lake Como',
    eventDate: '2025-10-03',
    cover: unsplashBySeed('autumn-in-lake-como-cover', 1400, 900),
    description: 'Foggy mornings and calm water with golden leaves.',
    photos: [
      toPhoto('autumn-in-lake-como', 1, 'Pier reflections'),
      toPhoto('autumn-in-lake-como', 2, 'Morning mist'),
      toPhoto('autumn-in-lake-como', 3, 'Boathouse'),
      toPhoto('autumn-in-lake-como', 4, 'Leaf tunnel'),
      toPhoto('autumn-in-lake-como', 5, 'Quiet lane'),
      toPhoto('autumn-in-lake-como', 6, 'Lakeside café'),
      toPhoto('autumn-in-lake-como', 7, 'Castle wall'),
      toPhoto('autumn-in-lake-como', 8, 'Blue hour water')
    ]
  },
  {
    id: 'winter-city-lights',
    isPrivate: true,
    year: 2025,
    title: 'Winter City Lights',
    eventDate: '2025-12-18',
    cover: unsplashBySeed('winter-city-lights-cover', 1400, 900),
    description: 'Street lamps, snow textures, and quiet late-night walks.',
    photos: [
      toPhoto('winter-city-lights', 1, 'Neon alley'),
      toPhoto('winter-city-lights', 2, 'Snow rooftop'),
      toPhoto('winter-city-lights', 3, 'Warm tram stop'),
      toPhoto('winter-city-lights', 4, 'Night square'),
      toPhoto('winter-city-lights', 5, 'Window glow'),
      toPhoto('winter-city-lights', 6, 'Bridge rain'),
      toPhoto('winter-city-lights', 7, 'Old district')
    ]
  },
  {
    id: 'spring-coast-drive',
    isPrivate: false,
    year: 2024,
    title: 'Spring Coast Drive',
    eventDate: '2024-04-22',
    cover: unsplashBySeed('spring-coast-drive-cover', 1400, 900),
    description: 'Cliff roads, sea breeze, and small beach stops.',
    photos: [
      toPhoto('spring-coast-drive', 1, 'Coastal turn'),
      toPhoto('spring-coast-drive', 2, 'Morning cliffs'),
      toPhoto('spring-coast-drive', 3, 'Shoreline café'),
      toPhoto('spring-coast-drive', 4, 'Golden cove'),
      toPhoto('spring-coast-drive', 5, 'Blue horizon'),
      toPhoto('spring-coast-drive', 6, 'Roadside flowers'),
      toPhoto('spring-coast-drive', 7, 'Sunset pull-over')
    ]
  },
  {
    id: 'desert-dawn-escape',
    isPrivate: false,
    year: 2024,
    title: 'Desert Dawn Escape',
    eventDate: '2024-02-11',
    cover: unsplashBySeed('desert-dawn-escape-cover', 1400, 900),
    description: 'Early light over dunes, canyon shadows, and long quiet roads.',
    photos: [
      toPhoto('desert-dawn-escape', 1, 'Rose dunes'),
      toPhoto('desert-dawn-escape', 2, 'Blue ridge'),
      toPhoto('desert-dawn-escape', 3, 'Canyon turn'),
      toPhoto('desert-dawn-escape', 4, 'Sunrise track'),
      toPhoto('desert-dawn-escape', 5, 'Dust trail'),
      toPhoto('desert-dawn-escape', 6, 'Golden horizon')
    ]
  },
  {
    id: 'city-rooftop-nights',
    isPrivate: false,
    year: 2023,
    title: 'City Rooftop Nights',
    eventDate: '2023-09-27',
    cover: unsplashBySeed('city-rooftop-nights-cover', 1400, 900),
    description: 'Late dinners, skyline silhouettes, and soft neon reflections.',
    photos: [
      toPhoto('city-rooftop-nights', 1, 'Skyline dinner'),
      toPhoto('city-rooftop-nights', 2, 'Glass reflections'),
      toPhoto('city-rooftop-nights', 3, 'Midnight avenue'),
      toPhoto('city-rooftop-nights', 4, 'Rooftop lights'),
      toPhoto('city-rooftop-nights', 5, 'Neon rain'),
      toPhoto('city-rooftop-nights', 6, 'Last train')
    ]
  }
];

export const years = Array.from(new Set(albumsSeed.map((album) => album.year))).sort((a, b) => b - a);
