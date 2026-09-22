import { ALBUM_DEFS, type AlbumSlug } from './album-defs';
import photosBySlug from './album-photos.json';

export type Photo = {
  file: string;
};

export type Album = {
  title: string;
  slug: AlbumSlug;
  photos: Photo[];
};

function filesFor(slug: AlbumSlug): Photo[] {
  const files = (photosBySlug as Record<string, string[]>)[slug] ?? [];
  return files.map((file) => ({ file }));
}

export const albums: Album[] = ALBUM_DEFS.map((def) => ({
  title: def.title,
  slug: def.slug,
  photos: filesFor(def.slug),
}));

export function getAlbum(slug: string): Album | undefined {
  return albums.find((album) => album.slug === slug);
}

export function photoBlobPath(slug: string, file: string, kind: 'full' | 'thumb'): string {
  if (kind === 'thumb') {
    return `photos/${slug}/thumbs/${file}`;
  }
  return `photos/${slug}/${file}`;
}

export function photoSrc(slug: string, file: string, kind: 'full' | 'thumb'): string {
  const blobPath = photoBlobPath(slug, file, kind);
  return `/photos/file/${blobPath.replace(/^photos\//, '')}`;
}

export function albumCover(album: Album): Photo | undefined {
  return album.photos[0];
}
