import Link from 'next/link';
import { notFound } from 'next/navigation';
import PhotoAlbum from '@/components/PhotoAlbum';
import { albums, getAlbum } from '@/lib/albums';

export function generateStaticParams() {
  return albums.map((album) => ({ slug: album.slug }));
}

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { slug } = await params;
  const { p } = await searchParams;
  const album = getAlbum(slug);
  if (!album) notFound();

  return (
    <div>
      <div className="details">
        <p className="photos-back">
          <Link href="/photos">All albums</Link>
        </p>
        <h2 className="subtitle">{album.title}</h2>
        <div className="rustic-line"></div>
      </div>

      {album.photos.length === 0 ? (
        <p className="words venue">Photos for this album are coming soon.</p>
      ) : (
        <PhotoAlbum
          slug={album.slug}
          title={album.title}
          photos={album.photos}
          initialParam={p}
        />
      )}
    </div>
  );
}
