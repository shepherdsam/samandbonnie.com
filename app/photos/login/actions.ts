'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PHOTOS_COOKIE, PHOTOS_COOKIE_VALUE, safePhotosNext } from '@/lib/photos-auth';

export async function loginPhotos(formData: FormData) {
  const password = formData.get('password') as string;
  const next = safePhotosNext(formData.get('next') as string | null);
  const correct = process.env.PHOTOS_PASSWORD;

  if (
    password &&
    correct &&
    password.toLocaleLowerCase() === correct.toLocaleLowerCase()
  ) {
    const cookieStore = await cookies();
    cookieStore.set(PHOTOS_COOKIE, PHOTOS_COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      sameSite: 'lax',
    });
    redirect(next);
  }

  redirect(`/photos/login?error=1&next=${encodeURIComponent(next)}`);
}
