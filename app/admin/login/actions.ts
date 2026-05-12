'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const password = formData.get('password') as string;
  const correct = process.env.DASHBOARD_PASSWORD;

  if (password && correct && password === correct) {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7d
      path: '/',
    });
    redirect('/admin/dashboard');
  }

  // Invalid: re-render login (could add error state later)
  redirect('/admin/login');
};
