export const PHOTOS_COOKIE = 'photos_session';
export const PHOTOS_COOKIE_VALUE = 'authenticated';

export function safePhotosNext(next: string | null | undefined): string {
  if (!next) return '/photos';
  if (!next.startsWith('/photos')) return '/photos';
  if (next.startsWith('//') || next.includes('://')) return '/photos';
  return next;
}
