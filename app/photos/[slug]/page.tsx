import Link from 'next/link';
import { notFound } from 'next/navigation';
import PhotoAlbum from '@/components/PhotoAlbum';
import { albums, getAlbum } from '@/lib/albums';

function AlbumBackLink({ atEnd = false }: { atEnd?: boolean }) {
  return (
    <p className={atEnd ? 'photos-back photos-back-end' : 'photos-back'}>
      <Link href="/photos">
        <span className="photos-back-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              d="M19 12H6M11 6.5 5.5 12 11 17.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        All albums
      </Link>
    </p>
  );
}

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
        <AlbumBackLink />
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

      <AlbumBackLink atEnd />
    </div>
  );
}
