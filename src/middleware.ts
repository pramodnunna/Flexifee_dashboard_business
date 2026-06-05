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

  const token = request.cookies.get('auth_session')?.value;

  // Security Redirect logic
  if (!token && !isPublicPath) {
    // Redirect unauthenticated users to login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isPublicPath) {
    // Redirect authenticated users away from login page to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Pass current pathname to request headers for conditional layout rendering in Server Components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', path);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}
