import { put } from '@vercel/blob';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ALBUM_DEFS } from '../lib/album-defs';

const SOURCE_DIR = path.join(process.cwd(), 'photos-source');
const LOCAL_DIR = path.join(process.cwd(), 'photos-local');
const MANIFEST_PATH = path.join(process.cwd(), 'lib', 'album-photos.json');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff']);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const localOnly = args.includes('--local');
const albumArg = args.find((arg) => !arg.startsWith('--'));

function resolveAlbums() {
  if (!albumArg) return [...ALBUM_DEFS];
  const needle = albumArg.trim().toLocaleLowerCase();
  const match = ALBUM_DEFS.filter(
    (album) =>
      album.slug === needle || album.title.toLocaleLowerCase() === needle,
  );
  if (match.length === 0) {
    const known = ALBUM_DEFS.map((album) => `${album.slug}  (${album.title})`).join('\n  ');
    throw new Error(`Unknown album "${albumArg}". Use a slug or title:\n  ${known}`);
  }
  return match;
}

function outputName(filename: string): string {
  return `${path.parse(filename).name}.webp`;
}

async function processImage(inputPath: string, longestEdge: number, square: boolean) {
  const image = sharp(inputPath).rotate();
  if (square) {
    return image
      .resize(longestEdge, longestEdge, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80 })
      .toBuffer();
  }
  return image
    .resize(longestEdge, longestEdge, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

async function store(blobPath: string, body: Buffer) {
  const localPath = path.join(LOCAL_DIR, blobPath);
  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, body);
  if (dryRun || localOnly) return;
  await put(blobPath, body, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'image/webp',
  });
}

async function readManifest(): Promise<Record<string, string[]>> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8');
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

async function main() {
  const albums = resolveAlbums();
  console.log(
    albums.length === 1
      ? `Processing album: ${albums[0].slug}`
      : `Processing ${albums.length} albums`,
  );
  const manifest = await readManifest();
  for (const def of ALBUM_DEFS) {
    if (!manifest[def.slug]) manifest[def.slug] = [];
  }

  for (const album of albums) {
    const albumDir = path.join(SOURCE_DIR, album.slug);
    let files: string[] = [];
    try {
      files = (await readdir(albumDir))
        .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } catch {
      console.warn(`Skipping missing folder: photos-source/${album.slug}`);
      if (!albumArg) manifest[album.slug] = [];
      continue;
    }

    const outputs: string[] = [];
    for (const file of files) {
      const inputPath = path.join(albumDir, file);
      const webpName = outputName(file);
      const full = await processImage(inputPath, 3000, false);
      const thumb = await processImage(inputPath, 300, true);
      await store(`photos/${album.slug}/${webpName}`, full);
      await store(`photos/${album.slug}/thumbs/${webpName}`, thumb);
      outputs.push(webpName);
      console.log(`${album.slug}/${webpName}`);
    }
    manifest[album.slug] = outputs;
  }

  const ordered: Record<string, string[]> = {};
  for (const def of ALBUM_DEFS) {
    ordered[def.slug] = manifest[def.slug] ?? [];
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify(ordered, null, 2)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), MANIFEST_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
