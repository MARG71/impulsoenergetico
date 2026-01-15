import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const rol = (session.user as any).rol ?? (session.user as any).role ?? null;
    const userId = (session.user as any).id ? Number((session.user as any).id) : null;
    const adminId = (session.user as any).adminId ? Number((session.user as any).adminId) : null;

    const tenantAdminId =
      rol === "SUPERADMIN" ? null : rol === "ADMIN" ? userId : adminId;

    if (rol !== "SUPERADMIN" && rol !== "ADMIN" && rol !== "AGENTE") {
      return NextResponse.json({ error: "No permitido" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as any));
    const { leadId, comparativaId } = body as {
      leadId?: number;
      comparativaId?: number;
    };

    if (!leadId || !comparativaId) {
      return NextResponse.json({ error: "leadId y comparativaId son obligatorios" }, { status: 400 });
    }

    // ✅ Blindaje tenant en el lead
    const whereLead: any = { id: Number(leadId) };
    if (rol !== "SUPERADMIN") {
      if (!tenantAdminId) return NextResponse.json({ error: "Tenant no resuelto" }, { status: 400 });
      whereLead.adminId = tenantAdminId;
    }

    const lead = await prisma.lead.findFirst({ where: whereLead });
    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    // ✅ Validar que la comparativa exista y pertenezca al mismo tenant (si aplica)
    const whereComp: any = { id: Number(comparativaId) };
    if (rol !== "SUPERADMIN") whereComp.adminId = tenantAdminId;

    const comp = await prisma.comparativa.findFirst({ where: whereComp });
    if (!comp) {
      return NextResponse.json({ error: "Comparativa no encontrada o sin permisos" }, { status: 404 });
    }

    const estadosOrden = ["pendiente", "contactado", "comparativa", "contrato", "cerrado", "perdido"];
    const idxActual = estadosOrden.indexOf((lead.estado || "pendiente").toLowerCase());
    const idxDestino = estadosOrden.indexOf("comparativa");

    const nuevoEstado = idxActual < idxDestino ? "comparativa" : lead.estado;

    const updated = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        comparativaId: comp.id,
        estado: nuevoEstado || "comparativa",
      },
    });

    return NextResponse.json({ ok: true, lead: updated });
  } catch (error) {
    console.error("[LEADS][VINCULAR] Error:", error);
    return NextResponse.json({ error: "Error vinculando lead" }, { status: 500 });
  }
}
