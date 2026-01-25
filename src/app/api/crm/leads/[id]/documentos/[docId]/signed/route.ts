export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinarySignedUrl } from "@/lib/cloudinary-signed";
import { getSessionOrThrow, sessionAdminId, sessionAgenteId, sessionRole } from "@/lib/auth-server";
import { v2 as cloudinary } from "cloudinary";

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
 * 🔎 Busca el recurso real en Cloudinary probando types:
 * authenticated -> private -> upload
 * Devuelve el type correcto + version + format reales.
 */
async function resolveCloudinaryResource(opts: { publicId: string; resourceType: "raw" | "image" | "video" }) {
  const tryTypes: Array<"authenticated" | "private" | "upload"> = ["authenticated", "private", "upload"];

  for (const t of tryTypes) {
    try {
      const r: any = await cloudinary.api.resource(opts.publicId, {
        resource_type: opts.resourceType,
        type: t,
      });

      return {
        deliveryType: t,
        version: typeof r?.version === "number" ? r.version : undefined,
        format: typeof r?.format === "string" ? r.format : undefined,
      };
    } catch {
      // probar siguiente type
    }
  }

  return null;
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
      return NextResponse.json({
        url: doc.url,
        expiresAt: null,
        fallback: true,
      });
    }

    const rt = ((doc.resourceType as any) || "raw") as "raw" | "image" | "video";

    // ✅ 1) Resolver el recurso real en Cloudinary
    const resolved = await resolveCloudinaryResource({ publicId: doc.publicId, resourceType: rt });

    if (!resolved) {
      // Esto explica exactamente lo que te está pasando ahora:
      // el publicId guardado no coincide con el recurso real o el type no es el esperado.
      return NextResponse.json(
        { error: "Cloudinary: no se encontró el recurso con ese publicId (authenticated/private/upload)" },
        { status: 404 }
      );
    }

    // ✅ 2) Generar URL firmada con datos reales
    const { url, expiresAt } = cloudinarySignedUrl({
      publicId: doc.publicId,
      resourceType: rt,
      deliveryType: resolved.deliveryType,
      expiresInSeconds: 60 * 60 * 24 * 7, // 7 días
      attachment: false,
      version: resolved.version,
      format: resolved.format,
    });

    return NextResponse.json({
      url,
      expiresAt,
      nombre: doc.nombre,
      docId: doc.id,
      leadId,
      deliveryType: resolved.deliveryType,
      version: resolved.version ?? null,
      format: resolved.format ?? null,
    });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    console.error("GET signed doc error:", e);
    return NextResponse.json({ error: "Error generando link firmado" }, { status: 500 });
  }
}
