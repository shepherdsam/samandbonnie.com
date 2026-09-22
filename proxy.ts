import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PHOTOS_COOKIE, PHOTOS_COOKIE_VALUE, safePhotosNext } from '@/lib/photos-auth'

const ADMIN_PATHS = ['/admin/dashboard']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login' || pathname === '/photos/login') {
    return NextResponse.next()
  }

  const isAdmin = ADMIN_PATHS.some((path) => pathname.startsWith(path))
  if (isAdmin) {
    const session = request.cookies.get('admin_session')?.value
    if (session !== 'authenticated') {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  const isPhotos = pathname === '/photos' || pathname.startsWith('/photos/')
  if (isPhotos) {
    const session = request.cookies.get(PHOTOS_COOKIE)?.value
    if (session !== PHOTOS_COOKIE_VALUE) {
      if (pathname.startsWith('/photos/file/')) {
        return new NextResponse('Unauthorized', { status: 401 })
      }
      const loginUrl = new URL('/photos/login', request.url)
      const next = safePhotosNext(`${pathname}${request.nextUrl.search}`)
      loginUrl.searchParams.set('next', next)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/photos', '/photos/:path*'],
}
