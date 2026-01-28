// src/app/api/crm/leads/[id]/documentos/upload/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { makeShareToken } from "@/lib/share-token";
import { getSessionOrThrow, sessionRole } from "@/lib/auth-server";

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
  try {
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
      deliveryType: "authenticated",
      accessMode: "authenticated",
    });

    const shareToken = makeShareToken();

    const doc = await prisma.leadDocumento.create({
      data: {
        leadId,
        nombre: file.name,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        deliveryType: "authenticated",
        mime: file.type || null,
        size: result.bytes,
        shareToken,
        shareExpiraEn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    });

    return NextResponse.json({ ok: true, documento: doc });
  } catch (e: any) {
    console.error("UPLOAD lead doc error:", e);
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    return NextResponse.json({ error: "Error subiendo documento" }, { status: 500 });
  }
}
