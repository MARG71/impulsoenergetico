import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function toInt(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getTenantContext(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return { ok: false as const, status: 401, error: "No autenticado" };

  const role = (token as any).role as Rol | undefined;
  const userId = toInt((token as any).id);
  const tokenAdminId = toInt((token as any).adminId); // para AGENTE/LUGAR
  const agenteId = toInt((token as any).agenteId);
  const lugarId = toInt((token as any).lugarId);

  const qAdminId = toInt(req.nextUrl.searchParams.get("adminId"));

  // tenantAdminId:
  // - SUPERADMIN: null => global, o qAdminId => modo tenant
  // - ADMIN: su propio userId
  // - AGENTE/LUGAR: tokenAdminId
  let tenantAdminId: number | null = null;

  if (role === "SUPERADMIN") tenantAdminId = qAdminId; // null => global
  else if (role === "ADMIN") tenantAdminId = userId;
  else tenantAdminId = tokenAdminId;

  return {
    ok: true as const,
    token,
    role,
    userId,
    agenteId,
    lugarId,
    tokenAdminId,
    tenantAdminId, // IMPORTANTÍSIMO
    isSuperadmin: role === "SUPERADMIN",
    isAdmin: role === "ADMIN",
    isAgente: role === "AGENTE",
    isLugar: role === "LUGAR",
  };
}
