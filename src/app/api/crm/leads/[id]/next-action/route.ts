// src/app/api/crm/leads/[id]/next-action/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSessionOrThrow,
  sessionAdminId,
  sessionAgenteId,
  sessionRole,
} from "@/lib/auth-server";

type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function parseId(id: unknown) {
  const n = Number(id);
  return !n || Number.isNaN(n) ? null : n;
}

function addHours(d: Date, hours: number) {
  const x = new Date(d);
  x.setHours(x.getHours() + hours);
  return x;
}

function buildWhatsAppLink(telefono: string, texto: string) {
  const tel = String(telefono || "").replace(/\s/g, "");
  const msg = encodeURIComponent(texto);
  return `https://wa.me/${tel}?text=${msg}`;
}

export async function POST(req: NextRequest, context: any) {
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session) as Role;

    const tenantAdminId = sessionAdminId(session);
    const agenteId = sessionAgenteId(session);
    const lugarId = Number((session.user as any)?.lugarId ?? null);
    const usuarioId = Number((session.user as any)?.id ?? null);

    const leadId = parseId(context?.params?.id);
    if (!leadId) return NextResponse.json({ error: "ID no válido" }, { status: 400 });

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        adminId: true,
        agenteId: true,
        lugarId: true,
        nombre: true,
        telefono: true,
        email: true,
        estado: true,
        proximaAccion: true,
        proximaAccionEn: true,
      },
    });

    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    // ✅ permisos multi-tenant
    if (role !== "SUPERADMIN") {
      if ((lead.adminId ?? null) !== tenantAdminId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // canal: "whatsapp" | "llamada" | "nota"
    const canal = String(body?.canal || "whatsapp").toLowerCase();
    const delayHours = Number(body?.delayHours ?? 48);
    const now = new Date();
    const nextAt = addHours(now, Number.isFinite(delayHours) ? delayHours : 48);

    // Plantilla simple (luego la hacemos inteligente por estado)
    const nombre = lead.nombre || "";
    const textoWhatsApp =
      body?.mensaje ||
      `Hola ${nombre}, soy de Impulso Energético. Te contacto por tu solicitud para ahorrar en tus facturas. ¿Te viene bien si lo vemos?`;

    let tipo = "accion";
    let titulo = "Acción ejecutada";
    let detalle: string | null = null;

    if (canal === "whatsapp") {
      tipo = "whatsapp";
      titulo = "WhatsApp enviado";
      detalle = textoWhatsApp;
    } else if (canal === "llamada") {
      tipo = "llamada";
      titulo = "Llamada realizada";
      detalle = "Se registró una llamada desde Lead Center PRO.";
    } else if (canal === "nota") {
      tipo = "nota";
      titulo = "Nota";
      detalle = body?.detalle ? String(body.detalle) : "Nota registrada.";
    }

    // ✅ 1) Crear actividad
    await prisma.leadActividad.create({
      data: {
        leadId,
        tipo,
        titulo,
        detalle,
        usuarioId: usuarioId || null,
        adminId: lead.adminId ?? tenantAdminId ?? null,
      },
    });

    // ✅ 2) Programar siguiente acción (+48h por defecto)
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        proximaAccion: canal === "whatsapp" ? "Seguimiento WhatsApp" : canal === "llamada" ? "Seguimiento llamada" : "Seguimiento",
        proximaAccionEn: nextAt,
      },
    });

    // ✅ 3) Respuesta para UI (link WA listo)
    const whatsappUrl = buildWhatsAppLink(lead.telefono || "", textoWhatsApp);

    return NextResponse.json({
      ok: true,
      leadId,
      canal,
      nextAt: nextAt.toISOString(),
      whatsappUrl,
      mensaje: textoWhatsApp,
    });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("next-action error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
