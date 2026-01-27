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
  try {
    const session = await getSessionOrThrow();
    const role = sessionRole(session);
    const tenantAdminId = sessionAdminId(session);
    const agenteId = sessionAgenteId(session);
    const lugarId = Number((session.user as any)?.lugarId ?? null);
    const usuarioId = Number((session.user as any)?.id ?? null);

    if (!["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"].includes(String(role))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const leadId = parseId(ctx?.params?.id);
    if (!leadId) return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });

    // 1) comprobar acceso al lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, adminId: true, agenteId: true, lugarId: true },
    });
    if (!lead) return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    if (role !== "SUPERADMIN") {
      if ((lead.adminId ?? null) !== tenantAdminId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    // 2) formData
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const nombre = (form.get("nombre") as string | null) ?? null;

    if (!file) return NextResponse.json({ error: "Falta el archivo (file)" }, { status: 400 });

    // 3) buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resourceType = guessResourceType(file.type);

    // ✅ CAMBIO CLAVE: TODO público (upload)
    const deliveryType: "upload" = "upload";

    // 5) upload cloudinary (carpeta por lead)
    const folder = `impulso/leads/${leadId}`;
    const result = await uploadBufferToCloudinary({
      buffer,
      folder,
      filename: file.name,
      resourceType,
      deliveryType: "upload",
      accessMode: "public",
    });

    // 6) token de share
    const shareToken = makeShareToken();
    const shareExpiraEn = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 días

    // 7) guardar en LeadDocumento
    const doc = await prisma.leadDocumento.create({
      data: {
        leadId,
        nombre: nombre || file.name,

        // ✅ aquí ya puedes usarla para abrir porque es pública
        url: result.secure_url,

        // ✅ seguimos guardando publicId por si quieres migrar luego
        publicId: result.public_id,
        resourceType: result.resource_type,
        deliveryType: "upload",

        mime: file.type || null,
        size: result.bytes,

        creadoPorId: usuarioId || null,
        adminId: lead.adminId ?? tenantAdminId ?? null,

        shareToken,
        shareExpiraEn,
      },
      include: { creadoPor: { select: { id: true, nombre: true, rol: true } } },
    });

    await prisma.leadActividad.create({
      data: {
        leadId,
        tipo: "documento",
        titulo: "Documento subido",
        detalle: `Se subió: ${doc.nombre}`,
        usuarioId: usuarioId || null,
        adminId: lead.adminId ?? tenantAdminId ?? null,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "https://impulsoenergetico.es";

    const shareUrl = `${baseUrl.replace(/\/$/, "")}/share/doc/${shareToken}`;

    return NextResponse.json({ ok: true, documento: doc, shareUrl }, { status: 201 });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    console.error("Lead documento upload error:", e);
    return NextResponse.json({ error: "Error subiendo documento" }, { status: 500 });
  }
}
