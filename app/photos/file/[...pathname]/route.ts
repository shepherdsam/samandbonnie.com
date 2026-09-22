import { get } from '@vercel/blob';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { PHOTOS_COOKIE, PHOTOS_COOKIE_VALUE } from '@/lib/photos-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BLOB_PATH = /^photos\/[a-z0-9-]+\/(thumbs\/)?[A-Za-z0-9._-]+\.webp$/;

function toBlobPath(segments: string[]): string | null {
  const blobPath = `photos/${segments.join('/')}`;
  if (blobPath.includes('..') || !BLOB_PATH.test(blobPath)) {
    return null;
  }
  return blobPath;
}

async function localFile(blobPath: string): Promise<Response | null> {
  if (process.env.NODE_ENV === 'production') return null;
  const filePath = path.join(process.cwd(), 'photos-local', blobPath);
  try {
    await access(filePath);
  } catch {
    return null;
  }
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>;
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'private, max-age=86400',
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pathname: string[] }> },
) {
  const cookieStore = await cookies();
  if (cookieStore.get(PHOTOS_COOKIE)?.value !== PHOTOS_COOKIE_VALUE) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { pathname } = await params;
  const blobPath = toBlobPath(pathname);
  if (!blobPath) {
    return new NextResponse('Not found', { status: 404 });
  }

  const local = await localFile(blobPath);
  if (local) return local;

  try {
    const result = await get(blobPath, { access: 'private' });
    if (result?.statusCode !== 200 || !result.stream) {
      return new NextResponse('Not found', { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType ?? 'image/webp',
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
