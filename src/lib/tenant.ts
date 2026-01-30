// src/lib/tenant.ts
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

const toInt = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export type TenantOk = {
  ok: true;
  role: Rol;
  userId: number;
  tenantAdminId: number | null;
  agenteId: number | null;
  lugarId: number | null;
  tokenAdminId: number | null;

  isSuperadmin: boolean;
  isAdmin: boolean;
  isAgente: boolean;
  isLugar: boolean;
  isCliente: boolean;
};

export type TenantErr = {
  ok: false;
  status: number;
  error: string;
};

export type TenantContext = TenantOk | TenantErr;

/**
 * ✅ Contexto multi-tenant
 * - SUPERADMIN: tenantAdminId = query ?adminId=... (si no viene => null => global)
 * - ADMIN: tenantAdminId = userId
 * - AGENTE/LUGAR/CLIENTE: tenantAdminId = token.adminId
 */
export async function getTenantContext(req: NextRequest): Promise<TenantContext> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return { ok: false, status: 401, error: "No autenticado" };
  }

  const role = ((token as any).role ?? null) as Rol | null;
  if (!role) {
    return { ok: false, status: 403, error: "Token sin role" };
  }

  // ✅ id puede venir como token.id o token.sub (según configuración)
  const userId = toInt((token as any).id ?? (token as any).sub);

  const agenteId = toInt((token as any).agenteId);
  const lugarId = toInt((token as any).lugarId);
  const tokenAdminId = toInt((token as any).adminId);

  if (!userId && role !== "SUPERADMIN") {
    return { ok: false, status: 403, error: "Token sin id de usuario" };
  }

  const qAdminId = toInt(req.nextUrl.searchParams.get("adminId"));

  let tenantAdminId: number | null = null;

  if (role === "SUPERADMIN") {
    tenantAdminId = qAdminId; // null => global
  } else if (role === "ADMIN") {
    tenantAdminId = userId!;
  } else {
    tenantAdminId = tokenAdminId;
  }

  return {
    ok: true,
    role,
    userId: userId ?? -1,
    tenantAdminId,
    agenteId,
    lugarId,
    tokenAdminId,

    isSuperadmin: role === "SUPERADMIN",
    isAdmin: role === "ADMIN",
    isAgente: role === "AGENTE",
    isLugar: role === "LUGAR",
    isCliente: role === "CLIENTE",
  };
}

export function requireRoles(role: Rol, allowed: Rol[]) {
  return allowed.includes(role);
}
