import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "id inválido" }, { status: 400 });

  const item = await prisma.cliente.findUnique({
    where: { id },
    include: {
      contrataciones: {
        orderBy: { creadaEn: "desc" },
        include: { seccion: true, subSeccion: true, agente: true, lugar: true },
      },
    },
  });

  if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(item);
}
