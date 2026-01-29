// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

// ✅ Rutas públicas (no requieren sesión)
const PUBLIC_PREFIX = [
  "/login",
  "/unauthorized",
  "/bienvenida",
  "/registro",
  "/contratar",
  "/share",
];

// ✅ Dashboard común (cualquier rol autenticado)
const DASHBOARD_PREFIX = ["/dashboard"];

// ✅ Zona Lugar (tu panel de lugar)
const ZONA_LUGAR_PREFIX = ["/zona-lugar"];

// ✅ SOLO SUPERADMIN (nunca visible como "superadmin" en UI, pero aquí sí se controla)
const SUPERADMIN_ONLY_PREFIX = [
  "/admins",
  "/configuracion", // secciones, comisiones-globales, etc.
];

// ✅ SOLO ADMIN/SUPERADMIN
const ADMIN_ONLY_PREFIX = [
  "/crear-usuario",
  "/lugares/fondos",
  // si tienes rutas de ajustes internos de comisiones antiguas, déjalas aquí:
  "/dashboard/comisiones",
];

// ✅ Rutas específicas de Comisiones (granular)
const COMISIONES_ADMIN_ONLY_PREFIX = [
  "/comisiones/admin", // planes de comisión
];

const COMISIONES_ALL_ROLES_PREFIX = [
  "/comisiones", // panel general
  "/comisiones/mis-comisiones",
];

// ✅ Módulos compartidos (CRM)
const SHARED_CRM_PREFIX = [
  "/contrataciones",
  "/clientes",
];

// ✅ CRM base (Admin/Agente/Superadmin)
const CRM_PREFIX = [
  "/pipeline-agentes",
  "/agentes",
  "/lugares",
  "/leads",
  "/fondos",
  "/productos-ganaderos",
  "/ofertas",
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
  // const isCliente = role === "CLIENTE"; // por si luego lo activas

  // ✅ 3) Dashboard (TODOS autenticados)
  if (matchesPrefix(path, DASHBOARD_PREFIX)) {
    return NextResponse.next();
  }

  // ✅ 4) Superadmin-only
  if (matchesPrefix(path, SUPERADMIN_ONLY_PREFIX)) {
    if (isSuperadmin) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 5) Admin-only
  if (matchesPrefix(path, ADMIN_ONLY_PREFIX)) {
    if (isSuperadmin || isAdmin) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 6) Zona Lugar
  if (matchesPrefix(path, ZONA_LUGAR_PREFIX)) {
    if (isLugar || isSuperadmin || isAdmin || isAgente) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 7) Comisiones admin-only (planes)
  if (matchesPrefix(path, COMISIONES_ADMIN_ONLY_PREFIX)) {
    if (isSuperadmin || isAdmin) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 8) Comisiones (panel + mis comisiones) para todos los roles CRM (incluye LUGAR)
  if (matchesPrefix(path, COMISIONES_ALL_ROLES_PREFIX)) {
    if (isSuperadmin || isAdmin || isAgente || isLugar) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 9) Contrataciones / Clientes para todos los roles CRM (incluye LUGAR)
  if (matchesPrefix(path, SHARED_CRM_PREFIX)) {
    if (isSuperadmin || isAdmin || isAgente || isLugar) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 10) CRM general (Admin/Agente/Superadmin)
  if (matchesPrefix(path, CRM_PREFIX)) {
    if (isSuperadmin || isAdmin || isAgente) return NextResponse.next();

    // Si quieres permitir a LUGAR entrar a /lugares (lectura), lo hacemos aquí:
    if (isLugar && matchesPrefix(path, ["/lugares"])) return NextResponse.next();

    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ 11) Resto: autenticado = OK
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo-impulso.jpeg).*)"],
};
