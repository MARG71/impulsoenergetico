export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinarySignedUrl } from "@/lib/cloudinary-signed";
import {
  getSessionOrThrow,
  sessionAdminId,
  sessionAgenteId,
  sessionRole,
} from "@/lib/auth-server";
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
    if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId)
      throw new Error("FORBIDDEN");
    if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId)
      throw new Error("FORBIDDEN");
  }

  return { session, lead, role, tenantAdminId };
}

// ✅ Detecta en qué "type" existe el asset en Cloudinary: authenticated / private / upload
async function resolveDeliveryTypeAndMeta(opts: {
  publicId: string;
  resourceType: "raw" | "image" | "video";
}) {
  const candidates: Array<"authenticated" | "private" | "upload"> = [
    "authenticated",
    "private",
    "upload",
  ];

  for (const type of candidates) {
    try {
      const r = await cloudinary.api.resource(opts.publicId, {
        resource_type: opts.resourceType,
        type,
      });

      return {
        deliveryType: type,
        version: typeof r?.version === "number" ? r.version : undefined,
        format: typeof r?.format === "string" ? r.format : undefined,
      };
    } catch {
      // probar siguiente
    }
  }

  throw new Error("CLOUDINARY_NOT_FOUND_ANY_TYPE");
}

export async function GET(_req: Request, ctx: any) {
  try {
    const leadId = parseId(ctx?.params?.id);
    const docId = parseId(ctx?.params?.docId);

    if (!leadId)
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    if (!docId)
      return NextResponse.json({ error: "ID de documento no válido" }, { status: 400 });

    await assertLeadAccess(leadId);

    const doc = await prisma.leadDocumento.findFirst({
      where: { id: docId, leadId },
      select: { id: true, nombre: true, url: true, publicId: true, resourceType: true },
    });

    if (!doc)
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    // ✅ Fallback si no hay publicId
    if (!doc.publicId) {
      return NextResponse.json({
        url: doc.url,
        expiresAt: null,
        fallback: true,
      });
    }

    const rt = ((doc.resourceType as any) || "raw") as "raw" | "image" | "video";

    // ✅ Si publicId viene con extensión (archivo.pdf), separamos format
    const mExt = String(doc.publicId || "").match(/^(.*)\.([a-z0-9]+)$/i);
    const publicIdClean = mExt ? mExt[1] : doc.publicId;
    const formatFromPublicId = mExt ? mExt[2].toLowerCase() : undefined;

    // ✅ Intentamos leer meta real desde Cloudinary (type + version + format)
    let deliveryType: "authenticated" | "private" | "upload" = "authenticated";
    let version: number | undefined = undefined;
    let format: string | undefined = formatFromPublicId;

    try {
      const meta = await resolveDeliveryTypeAndMeta({
        publicId: publicIdClean,
        resourceType: rt,
      });

      deliveryType = meta.deliveryType;
      version = meta.version ?? version;
      format = meta.format ?? format;
    } catch (e: any) {
      // si no existe en ningún type, devolvemos 404 claro
      if (e?.message === "CLOUDINARY_NOT_FOUND_ANY_TYPE") {
        return NextResponse.json(
          { error: "Documento no encontrado en Cloudinary (type mismatch)" },
          { status: 404 }
        );
      }
      // otros errores: seguimos con fallback (por si Cloudinary API falla puntual)
    }

    // ✅ Si no conseguimos version por API, la sacamos de la URL guardada (…/v1768762222/…)
    if (!version) {
      const mv = String(doc.url || "").match(/\/v(\d+)\//);
      version = mv ? Number(mv[1]) : undefined;
    }

    // ✅ 7 días
    const { url, expiresAt } = cloudinarySignedUrl({
      publicId: publicIdClean,
      resourceType: rt,
      deliveryType, // 🔥 la clave: authenticated / private / upload correcto
      expiresInSeconds: 60 * 60 * 24 * 7,
      attachment: false,
      version,
      format,
    });

    return NextResponse.json({
      url,
      expiresAt,
      nombre: doc.nombre,
      docId: doc.id,
      leadId,
      deliveryType,
      version,
      format,
    });
  } catch (e: any) {
    if (e?.message === "NO_AUTH")
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (e?.message === "FORBIDDEN")
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    console.error("GET signed doc error:", e);
    return NextResponse.json({ error: "Error generando link firmado" }, { status: 500 });
  }
}
