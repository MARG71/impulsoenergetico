export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext(req);
  if (!ctx.ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cartelId = safeNumber(params.id);
  if (!cartelId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  // 1) Leemos registro
  const cartel = await prisma.cartelGenerado.findUnique({
    where: { id: cartelId },
    select: {
      id: true,
      adminId: true,
      archivoUrl: true,
      archivoMime: true,
      tipo: true,
      accion: true,
    },
  });

  if (!cartel) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!cartel.archivoUrl) return NextResponse.json({ error: "Este registro no tiene archivo" }, { status: 404 });

  // 2) Tenant guard (si aplica)
  if (!ctx.isSuperadmin && (ctx as any).adminId && cartel.adminId && cartel.adminId !== (ctx as any).adminId) {
    return NextResponse.json({ error: "No permitido" }, { status: 403 });
  }

  // 3) Server-side fetch (sin CORS)
  const r = await fetch(cartel.archivoUrl);
  if (!r.ok) {
    return NextResponse.json({ error: "No se pudo obtener el archivo remoto" }, { status: 502 });
  }

  const arrayBuffer = await r.arrayBuffer();

  const mime = cartel.archivoMime || r.headers.get("content-type") || "application/pdf";
  const ext = mime.includes("png") ? "png" : mime.includes("pdf") ? "pdf" : "bin";

  const filename = `cartel_${cartel.id}.${ext}`;

  // 4) Respuesta con headers de descarga
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
