export const ALBUM_DEFS = [
  { title: 'Bride & Groom', slug: 'bride-and-groom' },
  { title: 'Getting Ready', slug: 'getting-ready' },
  { title: 'First Look', slug: 'first-look' },
  { title: 'Family', slug: 'family' },
  { title: 'Ceremony', slug: 'ceremony' },
  { title: 'Reception', slug: 'reception' },
  { title: 'Sunset', slug: 'sunset' },
  { title: 'Departure', slug: 'departure' },
  { title: 'Black & White', slug: 'black-and-white' },
] as const;

export type AlbumSlug = (typeof ALBUM_DEFS)[number]['slug'];
