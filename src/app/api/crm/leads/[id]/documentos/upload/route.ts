// src/app/api/crm/leads/[id]/documentos/upload/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { makeShareToken } from "@/lib/share-token";
import { getSessionOrThrow, sessionAdminId, sessionAgenteId, sessionRole } from "@/lib/auth-server";

function parseId(id: unknown) {
  const n = Number(id);
  return !n || Number.isNaN(n) ? null : n;
}

function guessResourceType(mime: string): "image" | "video" | "raw" {
  if (!mime) return "raw";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw";
}

export async function POST(req: NextRequest, ctx: any) {
  const session = await getSessionOrThrow();
  const role = sessionRole(session);

  if (!["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"].includes(String(role))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const leadId = parseId(ctx?.params?.id);
  if (!leadId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Falta archivo" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const resourceType = guessResourceType(file.type);

  const result = await uploadBufferToCloudinary({
    buffer,
    folder: `impulso/leads/${leadId}`,
    filename: file.name,
    resourceType,
    deliveryType: "upload",
    accessMode: "public",
  });

  const shareToken = makeShareToken();

  const doc = await prisma.leadDocumento.create({
    data: {
      leadId,
      nombre: file.name,
      url: result.secure_url,          // ✅ AÑADIR ESTO
      publicId: result.public_id,
      resourceType: result.resource_type,
      deliveryType: "upload",
      mime: file.type,
      size: result.bytes,
      shareToken,
      shareExpiraEn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });


  return NextResponse.json({ ok: true, documento: doc });
}
