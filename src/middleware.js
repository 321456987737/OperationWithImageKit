import { NextResponse } from 'next/server';
import {withAuth} from 'next-auth/middleware';
export default withAuth({
  callbacks: {
    async authorized({ req, token }) {
      // Allow access to auth-related routes without authentication
      const { pathname } = req.nextUrl;
      
      // Public routes that don't require authentication
      if (
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname === '/'
      ) {
        return true;
      }
      
      // API video routes are public
      if (pathname.startsWith('/api/video')) {
        return true;
      }

      // All other routes require authentication
      return !!token;
    }
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};