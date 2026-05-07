import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/admin/dashboard']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const isProtected = PROTECTED_PATHS.some(path => pathname.startsWith(path))
  if (!isProtected) {
    return NextResponse.next()
  }

  const session = request.cookies.get('admin_session')?.value
  if (session !== 'authenticated') {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
