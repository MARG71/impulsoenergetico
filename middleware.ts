// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/unauthorized", "/bienvenida", "/registro", "/contratar"];

// ✅ Dashboard común (cualquier rol autenticado)
const DASHBOARD_COMMON_PREFIX = ["/dashboard"];

// ✅ Zona Lugar (LUGAR) — permitimos también ADMIN/AGENTE/SUPERADMIN para poder revisar si quieres
const ZONA_LUGAR_PREFIX = ["/zona-lugar"];

// ✅ CRM solo ADMIN/AGENTE/SUPERADMIN
const ADMIN_OR_AGENT_PATHS = [
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

// ✅ Rutas SOLO ADMIN/SUPERADMIN (si quieres refinar más aún)
const ADMIN_ONLY_PREFIX = [
  "/dashboard/comisiones",
  "/crear-usuario",
  "/productos-ganaderos",
  "/ofertas",
  "/agentes",
  "/lugares/fondos",
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Público
  if (PUBLIC_PATHS.includes(path)) return NextResponse.next();

  // Token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | undefined;
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
  const isAgente = role === "AGENTE";
  const isLugar = role === "LUGAR";

  // ✅ Dashboard común para TODOS los roles autenticados
  if (DASHBOARD_COMMON_PREFIX.some((p) => path === p || path.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // ✅ Admin-only (si coincide)
  if (ADMIN_ONLY_PREFIX.some((p) => path === p || path.startsWith(p + "/"))) {
    if (!isAdmin) return NextResponse.redirect(new URL("/unauthorized", req.url));
    return NextResponse.next();
  }

  // ✅ Zona Lugar
  if (ZONA_LUGAR_PREFIX.some((p) => path === p || path.startsWith(p + "/"))) {
    if (isLugar || isAdmin || isAgente) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ CRM Admin/Agente
  const isAdminOrAgentPath = ADMIN_OR_AGENT_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  if (isAdminOrAgentPath) {
    if (isAdmin || isAgente) return NextResponse.next();
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ✅ Resto: autenticado = OK
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|api/solicitudes-contrato|_next/static|_next/image|favicon.ico|logo-impulso.jpeg|login|unauthorized|bienvenida|registro|contratar).*)",
  ],
};
