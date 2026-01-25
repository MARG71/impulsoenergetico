export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinarySignedUrl } from "@/lib/cloudinary-signed";
import { getSessionOrThrow, sessionAdminId, sessionAgenteId, sessionRole } from "@/lib/auth-server";

function parseId(id: unknown) {
  const n = Number(id);
  return !n || Number.isNaN(n) ? null : n;
}

async function assertLeadAccess(leadId: number) {
  const session = await getSessionOrThrow();
  const role = sessionRole(session);
  const tenantAdminId = sessionAdminId(session);
  const agenteId = sessionAgenteId(session);
  const lugarId = Number((session.user as any)?.lugarId ?? null);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, adminId: true, agenteId: true, lugarId: true },
  });

  if (!lead) return;

  if (role !== "SUPERADMIN") {
    if ((lead.adminId ?? null) !== tenantAdminId) throw new Error("FORBIDDEN");
    if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) throw new Error("FORBIDDEN");
    if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId) throw new Error("FORBIDDEN");
  }
}

export async function GET(_req: Request, ctx: any) {
  try {
    const leadId = parseId(ctx?.params?.id);
    const docId = parseId(ctx?.params?.docId);

    if (!leadId) return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    if (!docId) return NextResponse.json({ error: "ID de documento no válido" }, { status: 400 });

    await assertLeadAccess(leadId);

    const doc = await prisma.leadDocumento.findFirst({
      where: { id: docId, leadId },
      select: { id: true, nombre: true, url: true, publicId: true, resourceType: true },
    });

    if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    // Fallback si no hay publicId
    if (!doc.publicId) {
      return NextResponse.json({ url: doc.url, expiresAt: null, fallback: true });
    }

    const rt = (doc.resourceType as any) || "raw";

    // version desde url (…/v12345/…)
    const mv = String(doc.url || "").match(/\/v(\d+)\//);
    const version = mv ? Number(mv[1]) : undefined;

    // si publicId viene con .pdf => separar formato
    const mExt = String(doc.publicId || "").match(/^(.*)\.([a-z0-9]+)$/i);
    const publicIdClean = mExt ? mExt[1] : doc.publicId;
    const format = mExt ? mExt[2].toLowerCase() : undefined;

    const { url, expiresAt } = cloudinarySignedUrl({
      publicId: publicIdClean,
      resourceType: rt,
      deliveryType: "authenticated",   // ✅ CLAVE (evita /upload/ y el 401)
      expiresInSeconds: 60 * 60 * 24 * 7,
      attachment: true,                // ✅ descarga (evita visor)
      version,
      format,
    });

    return NextResponse.json({ url, expiresAt, nombre: doc.nombre, docId: doc.id, leadId });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    console.error("GET signed doc error:", e);
    return NextResponse.json({ error: "Error generando link firmado" }, { status: 500 });
  }
}
