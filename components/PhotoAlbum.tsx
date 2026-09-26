'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import ProtectedImage from '@/components/ProtectedImage';
import { photoSrc, type Photo } from '@/lib/albums';

type PhotoAlbumProps = {
  slug: string;
  title: string;
  photos: Photo[];
  initialParam?: string;
};

function parseIndex(value: string | null | undefined, count: number): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1 || n > count) return null;
  return n - 1;
}

function neighborIndexes(index: number, count: number): number[] {
  const next: number[] = [];
  if (index > 0) next.push(index - 1);
  if (index < count - 1) next.push(index + 1);
  return next;
}

export default function PhotoAlbum({ slug, title, photos, initialParam }: PhotoAlbumProps) {
  const pathname = usePathname();
  const count = photos.length;
  const [index, setIndex] = useState<number | null>(() => parseIndex(initialParam, count));
  const [readyFile, setReadyFile] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  const setOpen = useCallback((next: number | null) => {
    setIndex(next);
    if (next === null) {
      setReadyFile(null);
      setSlow(false);
    }
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (index === null || count === 0) return;
      const next = index + delta;
      if (next < 0 || next >= count) return;
      setIndex(next);
    },
    [count, index],
  );

  useEffect(() => {
    const url = index === null ? pathname : `${pathname}?p=${index + 1}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === url) return;
    window.history.replaceState(window.history.state, '', url);
  }, [index, pathname]);

  useEffect(() => {
    function onPop() {
      const p = new URL(window.location.href).searchParams.get('p');
      setIndex(parseIndex(p, count));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [count]);

  const lightboxOpen = index !== null;

  useLayoutEffect(() => {
    if (!lightboxOpen) return;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
      overflowX: body.style.overflowX,
      overflowY: body.style.overflowY,
    };
    const scrollbar = window.innerWidth - documentElement.clientWidth;

    // iOS Safari anchors position:fixed to the top of the document when body
    // overflow is hidden or clip, so a photo opened mid-album sits off screen.
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflowX = 'visible';
    body.style.overflowY = 'visible';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.paddingRight = previous.paddingRight;
      body.style.overflowX = previous.overflowX;
      body.style.overflowY = previous.overflowY;
      window.scrollTo(scrollX, scrollY);
    };
  }, [lightboxOpen]);

  useLayoutEffect(() => {
    if (!lightboxOpen) return;
    const node = lightboxRef.current;
    const viewport = window.visualViewport;
    if (!node || !viewport) return;

    const pin = () => {
      node.style.top = `${viewport.offsetTop}px`;
      node.style.height = `${viewport.height}px`;
    };
    pin();
    viewport.addEventListener('resize', pin);
    viewport.addEventListener('scroll', pin);
    return () => {
      viewport.removeEventListener('resize', pin);
      viewport.removeEventListener('scroll', pin);
      node.style.top = '';
      node.style.height = '';
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (index === null) return;
    closeRef.current?.focus({ preventScroll: true });

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(null);
      } else if (event.key === 'ArrowLeft') {
        step(-1);
      } else if (event.key === 'ArrowRight') {
        step(1);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [index, setOpen, step]);

  const openPhoto = index !== null ? photos[index] : null;
  const targetFile = openPhoto?.file ?? null;
  const waiting = Boolean(targetFile && readyFile !== targetFile && slow);
  const preloadFiles = index === null
    ? []
    : neighborIndexes(index, count).map((i) => photos[i].file);

  useEffect(() => {
    if (!targetFile || readyFile === targetFile) {
      setSlow(false);
      return;
    }
    setSlow(false);
    const timer = window.setTimeout(() => setSlow(true), 120);
    return () => window.clearTimeout(timer);
  }, [targetFile, readyFile]);

  return (
    <>
      <ul className="photo-grid">
        {photos.map((photo, i) => (
          <li key={photo.file}>
            <button
              type="button"
              className="photo-cell"
              onClick={() => setOpen(i)}
              aria-label={`Open photo ${i + 1} of ${count} in ${title}`}
            >
              <ProtectedImage
                src={photoSrc(slug, photo.file, 'thumb')}
                alt=""
              />
            </button>
          </li>
        ))}
      </ul>

      {openPhoto && index !== null && targetFile ? (
        <div
          ref={lightboxRef}
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${title}, photo ${index + 1} of ${count}`}
          aria-busy={waiting}
          onClick={() => setOpen(null)}
        >
          <button
            ref={closeRef}
            type="button"
            className="lightbox-close"
            onClick={() => setOpen(null)}
            aria-label="Close"
          >
            ×
          </button>
          {index > 0 ? (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
              aria-label="Previous photo"
            >
              ‹
            </button>
          ) : null}
          <img
            className="lightbox-image"
            src={photoSrc(slug, readyFile ?? targetFile, 'full')}
            alt={`${title} photo ${index + 1}`}
            draggable={false}
            onContextMenu={(event) => event.preventDefault()}
            onClick={(event) => event.stopPropagation()}
            onLoad={() => setReadyFile((current) => current ?? targetFile)}
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0) {
                queueMicrotask(() => setReadyFile((current) => current ?? targetFile));
              }
            }}
            onTouchStart={(event) => {
              touchStartX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              if (start == null) return;
              const delta = event.changedTouches[0].clientX - start;
              if (delta > 50) step(-1);
              if (delta < -50) step(1);
            }}
          />
          {waiting ? <div className="lightbox-waiting" aria-hidden="true" /> : null}
          {targetFile !== readyFile ? (
            <img
              className="lightbox-preload"
              src={photoSrc(slug, targetFile, 'full')}
              alt=""
              onLoad={() => setReadyFile(targetFile)}
              ref={(node) => {
                if (node?.complete && node.naturalWidth > 0) {
                  queueMicrotask(() => setReadyFile(targetFile));
                }
              }}
            />
          ) : null}
          {preloadFiles.map((file) => (
            <img
              key={file}
              className="lightbox-preload"
              src={photoSrc(slug, file, 'full')}
              alt=""
            />
          ))}
          {index < count - 1 ? (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
              aria-label="Next photo"
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
