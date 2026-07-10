import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/auth/forgot-password', '/auth/reset-password', '/auth/callback'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie — the client stores the session under
  // either the custom storageKey or the default sb-<ref>-auth-token name.
  const cookieNames = [
    'tgs-auth-token',
    'sb-jtnqiwgymhmqptlawntx-auth-token',
  ];
  const hasAuthCookie = cookieNames.some(name => {
    const cookie = req.cookies.get(name);
    return !!cookie && cookie.value.length > 10;
  });

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
