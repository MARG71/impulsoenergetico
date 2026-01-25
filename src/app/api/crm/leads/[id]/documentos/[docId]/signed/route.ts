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

  if (!lead) return { session, lead: null as any, role, tenantAdminId };

  if (role !== "SUPERADMIN") {
    if ((lead.adminId ?? null) !== tenantAdminId) throw new Error("FORBIDDEN");
    if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) throw new Error("FORBIDDEN");
    if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId) throw new Error("FORBIDDEN");
  }

  return { session, lead, role, tenantAdminId };
}

/**
 * Extrae publicId + resourceType + deliveryType desde una URL de Cloudinary:
 * Ej:
 * https://res.cloudinary.com/<cloud>/raw/authenticated/v1769339857/impulso/leads/25/archivo.pdf
 * pathname parts => [ "raw", "authenticated", "v1769339857", "impulso", "leads", "25", "archivo.pdf" ]
 */
function extractFromCloudinaryUrl(url: string) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);

    // ✅ OJO: parts[0] es "raw" | "image" | "video"
    const resourceType = (parts[0] || "raw") as "raw" | "image" | "video";

    // ✅ parts[1] es "upload" | "authenticated" | "private"
    const deliveryType = (parts[1] || "upload") as "upload" | "authenticated" | "private";

    // buscamos índice de "v12345" (si existe)
    const vIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    const afterV = vIdx >= 0 ? parts.slice(vIdx + 1) : parts.slice(2);

    const last = afterV[afterV.length - 1] || "";
    const mExt = last.match(/^(.*)\.([a-z0-9]+)$/i);

    const format = mExt ? mExt[2].toLowerCase() : undefined;

    // reconstruye publicId sin extensión
    const fileNoExt = mExt ? mExt[1] : last;
    const folder = afterV.slice(0, -1);
    const publicId = [...folder, fileNoExt].join("/");

    return { resourceType, deliveryType, publicId, format };
  } catch {
    return null;
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

    const fromUrl = extractFromCloudinaryUrl(doc.url || "");

    // ✅ Si el doc es público (upload), devolvemos directamente doc.url
    if (fromUrl?.deliveryType === "upload") {
      return NextResponse.json({
        url: doc.url,
        expiresAt: null,
        nombre: doc.nombre,
        docId: doc.id,
        leadId,
        fallback: "public-url",
      });
    }

    // ✅ Para authenticated/private: derivar de doc.url (más fiable)
    const publicId = fromUrl?.publicId || doc.publicId;
    if (!publicId) {
      return NextResponse.json({ error: "Documento sin publicId" }, { status: 500 });
    }

    const rt = (fromUrl?.resourceType || (doc.resourceType as any) || "raw") as "raw" | "image" | "video";
    const deliveryType = (fromUrl?.deliveryType || "authenticated") as "authenticated" | "private" | "upload";

    // ✅ Para RAW/PDF lo más robusto es NO forzar format
    const format = rt === "raw" ? undefined : fromUrl?.format;

    const { url, expiresAt } = cloudinarySignedUrl({
      publicId,
      resourceType: rt,
      deliveryType,
      expiresInSeconds: 60 * 60 * 24 * 7,
      attachment: false,
      ...(format ? { format } : {}),
    });

    return NextResponse.json({
      url,
      expiresAt,
      nombre: doc.nombre,
      docId: doc.id,
      leadId,
    });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    console.error("GET signed doc error:", e);
    return NextResponse.json({ error: "Error generando link firmado" }, { status: 500 });
  }
}
