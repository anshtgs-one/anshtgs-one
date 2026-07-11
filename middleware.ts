import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/auth/forgot-password', '/auth/reset-password', '/auth/callback'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie — accept the custom storageKey (`tgs-auth-token`)
  // or any Supabase default cookie matching `sb-<project-ref>-auth-token`.
  // Also accept a Bearer token in `Authorization` as a server-side fallback.
  const cookieHeader = req.headers.get('cookie') || '';
  const hasTgs = cookieHeader.includes('tgs-auth-token=');
  const sbMatch = cookieHeader.match(/sb-[a-z0-9]+-auth-token=([^;]+)/i);
  const hasSb = !!(sbMatch && sbMatch[1] && sbMatch[1].length > 10);
  const authHeader = req.headers.get('authorization') || '';
  const hasAuthHeader = authHeader.toLowerCase().startsWith('bearer ');
  const hasAuthCookie = hasTgs || hasSb || hasAuthHeader;

  if (!hasAuthCookie) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)'],
};
