import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/server/session-token';

const PUBLIC_PAGE_PATHS = new Set([
  '/login',
  '/recuperar-senha',
  '/redefinir-senha',
  '/termos'
]);

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-2fa',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/cron/'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar ativos estáticos e arquivos públicos do PWA
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/apple-touch-icon')
  ) {
    return NextResponse.next();
  }

  const isPublicPage = PUBLIC_PAGE_PATHS.has(pathname);
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const rawCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(rawCookie);

  // Se a sessão foi revogada no PostgreSQL, limpa o cookie obsoleto e exibe /login sem loop
  if (pathname === '/login') {
    if (request.nextUrl.searchParams.has('expired')) {
      const res = NextResponse.next();
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }
    if (session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // Bloqueio Zero-Trust na borda para usuários não autenticados
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada. Autentique-se novamente.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Controle RBAC estrito para Gestão / Compliance (/admin e /api/admin/*)
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  if (isAdminRoute && session.role !== 'admin' && session.role !== 'collaborator') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso restrito à equipe de Gestão e Compliance.' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
