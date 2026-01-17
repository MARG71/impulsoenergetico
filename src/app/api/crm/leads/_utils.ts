// src/app/api/crm/leads/_utils.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// Ajusta este import a tu proyecto:
// - si lo tienes en src/lib/authOptions.ts => "@/lib/authOptions"
// - si lo tienes en src/app/api/auth/[...nextauth]/route => no lo importes desde ahí (mejor extraerlo)
import { authOptions } from "@/lib/authOptions";

export type SessionCtx = {
  userId: string;
  role: "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR";
  adminId?: string | null;
  agenteId?: string | null;
  lugarId?: string | null;
};

export async function requireCrmSession(): Promise<
  { ok: true; ctx: SessionCtx } | { ok: false; res: NextResponse }
> {
  const session = await getServerSession(authOptions);

  // Tu JWT ya mete token.role/adminId/agenteId/lugarId,
  // y NextAuth lo deja normalmente en session.user (según callbacks).
  const user: any = session?.user;

  if (!session || !user?.role || !user?.id) {
    return {
      ok: false,
      res: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  const ctx: SessionCtx = {
    userId: String(user.id),
    role: user.role,
    adminId: user.adminId ?? null,
    agenteId: user.agenteId ?? null,
    lugarId: user.lugarId ?? null,
  };

  // Reglas mínimas
  if (ctx.role === "ADMIN" && !ctx.adminId) ctx.adminId = ctx.userId;

  return { ok: true, ctx };
}

export function leadWhereByRole(ctx: SessionCtx) {
  if (ctx.role === "SUPERADMIN") return {}; // ve todo

  if (ctx.role === "ADMIN") {
    const adminId = ctx.adminId ?? ctx.userId;
    return { adminId };
  }

  if (ctx.role === "AGENTE") {
    return {
      adminId: ctx.adminId ?? undefined,
      agenteId: ctx.agenteId ?? "__NO_MATCH__",
    };
  }

  // LUGAR
  return {
    adminId: ctx.adminId ?? undefined,
    lugarId: ctx.lugarId ?? "__NO_MATCH__",
  };
}

export function forbidSuperadminLeak(ctx: SessionCtx) {
  // Esto es solo una “idea”: evitar que en UI/queries se expongan usuarios SUPERADMIN.
  // En leads normalmente no aplica, pero lo dejo por si luego listáis usuarios.
  return ctx.role !== "SUPERADMIN";
}
