import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const path = req.nextUrl.pathname;
  const role = token?.role;

  console.log("🛡️ Middleware: token recibido:", token);
  console.log("➡️ Ruta solicitada:", path);

  if (!token) {
    console.log("❌ No hay token, redirigiendo a login");
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (path.startsWith('/dashboard') && role !== 'ADMIN') {
    console.log("❌ Acceso denegado a /dashboard para rol:", role);
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  if (path.startsWith('/panel-agente') && role !== 'AGENTE') {
    console.log("❌ Acceso denegado a /panel-agente para rol:", role);
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  if (path.startsWith('/zona-lugar') && role !== 'LUGAR') {
    console.log("❌ Acceso denegado a /zona-lugar para rol:", role);
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo-impulso.jpeg|login|unauthorized).*)',
  ],
};
