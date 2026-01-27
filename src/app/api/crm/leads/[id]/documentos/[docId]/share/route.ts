// src/app/api/crm/leads/[id]/documentos/[docId]/share/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeShareToken } from "@/lib/share-token";
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

  if (!lead) throw new Error("NOT_FOUND");

  if (role !== "SUPERADMIN") {
    if ((lead.adminId ?? null) !== tenantAdminId) throw new Error("FORBIDDEN");
    if (role === "AGENTE" && agenteId && lead.agenteId !== agenteId) throw new Error("FORBIDDEN");
    if (role === "LUGAR" && lugarId && lead.lugarId !== lugarId) throw new Error("FORBIDDEN");
  }

  return { session, tenantAdminId };
}

export async function POST(_req: Request, ctx: any) {
  try {
    const leadId = parseId(ctx?.params?.id);
    const docId = parseId(ctx?.params?.docId);

    if (!leadId) return NextResponse.json({ error: "Lead inválido" }, { status: 400 });
    if (!docId) return NextResponse.json({ error: "Doc inválido" }, { status: 400 });

    const { session, tenantAdminId } = await assertLeadAccess(leadId);

    const doc = await prisma.leadDocumento.findFirst({
      where: { id: docId, leadId },
      select: { id: true, nombre: true, shareToken: true, shareExpiraEn: true },
    });

    if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

    let shareToken = doc.shareToken;
    let shareExpiraEn = doc.shareExpiraEn;

    if (!shareToken || (shareExpiraEn && shareExpiraEn.getTime() < Date.now())) {
      shareToken = makeShareToken();
      shareExpiraEn = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 días

      await prisma.leadDocumento.update({
        where: { id: doc.id },
        data: {
          shareToken,
          shareExpiraEn,
        },
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      "https://impulsoenergetico.es";

    const shareUrl = `${baseUrl.replace(/\/$/, "")}/share/doc/${shareToken}`;

    return NextResponse.json({
      ok: true,
      nombre: doc.nombre,
      shareUrl,
      expiraEn: shareExpiraEn,
    });
  } catch (e: any) {
    if (e?.message === "NO_AUTH") return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (e?.message === "FORBIDDEN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    if (e?.message === "NOT_FOUND") return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });

    console.error("share create error:", e);
    return NextResponse.json({ error: "Error generando link" }, { status: 500 });
  }
}
