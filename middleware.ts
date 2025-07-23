// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Definir rutas protegidas por rol
const roleRoutes = {
  ADMIN: ['/dashboard'],
  AGENTE: ['/panel-agente'],
  LUGAR: ['/zona-lugar'],
};

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

  // Verificar si el rol tiene acceso a esta ruta
  const allowedPaths = roleRoutes[role as keyof typeof roleRoutes] || [];
  const hasAccess = allowedPaths.some((route) => path.startsWith(route));

  if (!hasAccess) {
    console.log(`❌ Acceso denegado para rol ${role} a la ruta ${path}`);
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo-impulso.jpeg|login|unauthorized).*)',
  ],
};
