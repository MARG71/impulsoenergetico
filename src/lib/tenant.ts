// src/lib/tenant.ts
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

const toInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function getTenantContext(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return { ok: false as const, status: 401, error: "No autenticado" };

  const role = (token as any).role as Rol | undefined;
  const userId = toInt((token as any).id);
  const tokenAdminId = toInt((token as any).adminId);
  const agenteId = toInt((token as any).agenteId);
  const lugarId = toInt((token as any).lugarId);

  if (!role || !userId) {
    return { ok: false as const, status: 401, error: "Token inválido" };
  }

  // SUPERADMIN puede elegir tenant con ?adminId=...
  const qAdminId = toInt(req.nextUrl.searchParams.get("adminId"));

  let tenantAdminId: number | null = null;

  if (role === "SUPERADMIN") {
    tenantAdminId = qAdminId; // null => global
  } else if (role === "ADMIN") {
    tenantAdminId = userId; // admin es el tenant
  } else {
    tenantAdminId = tokenAdminId; // agente/lugar pertenecen a un admin
  }

  return {
    ok: true as const,
    role,
    userId,
    tenantAdminId,
    agenteId,
    lugarId,
    tokenAdminId,
  };
}

export function requireRoles(role: Rol, allowed: Rol[]) {
  return allowed.includes(role);
}
