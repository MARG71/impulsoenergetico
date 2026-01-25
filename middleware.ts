// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

// ✅ Rutas públicas (no requieren sesión)
const PUBLIC_PREFIX = ["/login", "/unauthorized", "/bienvenida", "/registro", "/contratar", "/share"];


// ✅ Dashboard común (cualquier rol autenticado)
const DASHBOARD_PREFIX = ["/dashboard"];

// ✅ Zona Lugar (LUGAR) — permitimos también ADMIN/AGENTE/SUPERADMIN
const ZONA_LUGAR_PREFIX = ["/zona-lugar"];

// ✅ SOLO SUPERADMIN
const SUPERADMIN_ONLY_PREFIX = ["/admins"];

// ✅ Rutas SOLO ADMIN/SUPERADMIN
const ADMIN_ONLY_PREFIX = ["/crear-usuario", "/dashboard/comisiones", "/lugares/fondos"];

// ✅ CRM (ADMIN/AGENTE/SUPERADMIN)
const CRM_PREFIX = [
  "/pipeline-agentes",
  "/agentes",
  "/lugares",
  "/leads",
  "/fondos",
  "/productos-ganaderos",
  "/ofertas",
  "/configuracion",
  "/comparador",
];

function matchesPrefix(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // ✅ 1) Público
  if (matchesPrefix(path, PUBLIC_PREFIX)) {
    return NextResponse.next();
  }

  // ✅ 2) Token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (token as any).role as Role | undefined;

  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";
  const isAgente = role === "AGENTE";
  const isLugar = role === "LUGAR";

  // ✅ 3) Dashboard (TODOS autenticados)
  if (matchesPrefix(path, DASHBOARD_PREFIX)) {
    return NextResponse.next();
  }

  // ✅ 3.5) Superadmin-only
  if (matchesPrefix(path, SUPERADMIN_ONLY_PREFIX)) {
    if (isSuperadmin) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 4) Admin-only
  if (matchesPrefix(path, ADMIN_ONLY_PREFIX)) {
    if (isSuperadmin || isAdmin) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 5) Zona Lugar
  if (matchesPrefix(path, ZONA_LUGAR_PREFIX)) {
    if (isLugar || isSuperadmin || isAdmin || isAgente) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 6) CRM (Admin/Agente/Superadmin)
  if (matchesPrefix(path, CRM_PREFIX)) {
    if (isSuperadmin || isAdmin || isAgente) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 7) Resto: autenticado = OK
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo-impulso.jpeg).*)"],
};
