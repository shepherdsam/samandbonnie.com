import Link from 'next/link';
import ProtectedImage from '@/components/ProtectedImage';
import { albumCover, albums, photoSrc } from '@/lib/albums';

export default function PhotosPage() {
  return (
    <div>
      <div className="details">
        <h2 className="subtitle">Photos</h2>
        <div className="rustic-line"></div>
      </div>

      <ul className="album-index">
        {albums.map((album) => {
          const cover = albumCover(album);
          return (
            <li key={album.slug}>
              <Link href={`/photos/${album.slug}`} className="album-card">
                <div className="album-card-thumb">
                  {cover ? (
                    <ProtectedImage
                      src={photoSrc(album.slug, cover.file, 'thumb')}
                      alt=""
                    />
                  ) : (
                    <div className="album-card-placeholder" aria-hidden="true" />
                  )}
                </div>
                <span className="album-card-title">{album.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
