import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

/**
 * Staging security boundary for routes that previously trusted client-supplied
 * x-user-id. The header is removed and replaced using the signed, HttpOnly
 * session cookie after checking that the user is still active.
 *
 * Route handlers must still enforce their own object-level authorization.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith('/api/');
  const requiresAdmin = path === '/admin' || path.startsWith('/admin/') ||
    path === '/api/admin' || path.startsWith('/api/admin/');
  const session = request.cookies.get('auth-token')?.value;

  function deny(status: 401 | 403) {
    if (isApi) {
      return NextResponse.json({ error: status === 401 ? 'Unauthenticated' : 'Forbidden' }, { status });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!session || !process.env.JWT_SECRET) return deny(401);

  try {
    const { payload } = await jwtVerify(
      session,
      new TextEncoder().encode(process.env.JWT_SECRET),
      { algorithms: ['HS256'] }
    );
    if (typeof payload.userId !== 'string' || !payload.userId) return deny(401);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') return deny(401);
    if (requiresAdmin && user.role !== 'ADMIN') return deny(403);

    // Never accept identity headers from the browser or another untrusted client.
    const headers = new Headers(request.headers);
    headers.delete('x-user-id');
    headers.delete('x-authenticated-role');
    headers.set('x-user-id', user.id);
    headers.set('x-authenticated-role', user.role);

    return NextResponse.next({ request: { headers } });
  } catch (error) {
    console.error('Authenticated route denied:', error instanceof Error ? error.name : 'unknown');
    return deny(401);
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/affiliate/:path*',
    '/api/admin/:path*',
    '/api/affiliate/:path*',
    '/api/auth/me',
  ],
};
