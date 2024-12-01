// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await getToken({ req: request });
  
  if (!session && !request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/api/auth/signin', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*']
};