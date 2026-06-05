import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't need auth
  const isPublicPath = path === '/login';
  
  // Define asset paths to ignore from auth checks
  const isAsset = path.startsWith('/_next') || 
                  path.startsWith('/api') || 
                  path.includes('.') || // matches favicon.ico, images, files, etc.
                  path === '/favicon.ico';

  if (isAsset) {
    return NextResponse.next();
  }

  // Bypass prefetch requests to prevent Next.js client router from caching redirects
  const isPrefetch = request.headers.get('next-router-prefetch') === '1' ||
                     request.headers.get('purpose') === 'prefetch';

  if (isPrefetch) {
    const res = NextResponse.next();
    res.headers.set('x-middleware-cache', 'no-cache');
    return res;
  }

  const token = request.cookies.get('auth_session')?.value;

  // Security Redirect logic
  if (!token && !isPublicPath) {
    // Redirect unauthenticated users to login page
    const loginRedirect = NextResponse.redirect(new URL('/login', request.url));
    loginRedirect.headers.set('x-middleware-cache', 'no-cache');
    return loginRedirect;
  }

  if (token && isPublicPath) {
    // Redirect authenticated users away from login page to dashboard
    const dashboardRedirect = NextResponse.redirect(new URL('/', request.url));
    dashboardRedirect.headers.set('x-middleware-cache', 'no-cache');
    return dashboardRedirect;
  }

  // Pass current pathname to request headers for conditional layout rendering in Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', path);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });

  response.headers.set('x-middleware-cache', 'no-cache');
  return response;
}
