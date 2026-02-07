export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow, sessionRole, sessionAdminId } from "@/lib/auth-server";

function jsonError(status: number, message: string, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ? { extra } : {}) }, { status });
}

function toId(v: any) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const role = String(sessionRole(session) ?? "").toUpperCase();
    const myAdminId = sessionAdminId(session);
    const userId = Number((session.user as any)?.id ?? 0) || null;

    if (!["ADMIN", "SUPERADMIN"].includes(role)) return jsonError(403, "No autorizado");

    const body = await req.json().catch(() => ({}));
    const asientoId = toId(body?.asientoId);
    const motivo = String(body?.motivo ?? "").trim();

    if (!asientoId) return jsonError(400, "asientoId requerido");
    if (!motivo) return jsonError(400, "motivo requerido");

    const asiento = await prisma.asientoComision.findUnique({ where: { id: asientoId } });
    if (!asiento) return jsonError(404, "Asiento no encontrado");

    if (role !== "SUPERADMIN") {
      if (!myAdminId) return jsonError(400, "tenantAdminId no disponible");
      if ((asiento as any).adminId !== myAdminId) return jsonError(403, "No autorizado (tenant)");
    }

    if (String((asiento as any).estado) === "ANULADO") {
      return NextResponse.json({ ok: true, asiento, already: true });
    }

    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.asientoComision.update({
        where: { id: asientoId },
        data: {
          estado: "ANULADO" as any,
          anuladoEn: now as any,
          anuladoPorUserId: userId as any,
          anuladoMotivo: motivo as any,
        } as any,
      });

      // ⚠️ NO borramos movimientos, pero opcionalmente los dejamos a 0 para que no cuenten en liquidación.
      // Si prefieres mantener el importe y filtrar por estado, dime y lo cambiamos.
      await tx.movimientoComision.updateMany({
        where: { asientoId: asientoId } as any,
        data: {
          importeEUR: 0 as any,
          // si ya estaban asociados a liquidación, los dejamos (o podrías quitarlos):
          // liquidacionId: null,
        } as any,
      });

      // Audit trail (si tienes LeadActividad)
      const leadId = (asiento as any).leadId ?? null;
      if (leadId) {
        // Si tu tabla se llama distinto, esto fallará -> lo capturamos con try/catch
        try {
          await (tx as any).leadActividad.create({
            data: {
              leadId,
              tipo: "SISTEMA",
              titulo: "Asiento de comisión ANULADO",
              detalle: `Asiento #${asientoId} anulado. Motivo: ${motivo}`,
              creadoPorId: userId,
            },
          });
        } catch {}
      }

      return up;
    });

    return NextResponse.json({ ok: true, asiento: updated });
  } catch (e: any) {
    return jsonError(500, "Error anulando asiento", { message: String(e?.message ?? e) });
  }
}
