import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(req: Request) {
  const auth = await requireRole(["SUPERADMIN", "ADMIN", "AGENTE", "LUGAR"]);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (auth.session?.user as any)?.role as string | undefined;
  const agenteId = (auth.session?.user as any)?.agenteId as number | undefined;
  const lugarId = (auth.session?.user as any)?.lugarId as number | undefined;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  // Filtrado por rol, seguro
  const where: any = {};
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { telefono: { contains: q, mode: "insensitive" } },
    ];
  }

  if (role === "AGENTE") {
    if (!agenteId) return NextResponse.json([]);
    where.contrataciones = { some: { agenteId } };
  }
  if (role === "LUGAR") {
    if (!lugarId) return NextResponse.json([]);
    where.contrataciones = { some: { lugarId } };
  }

  const items = await prisma.cliente.findMany({
    where,
    orderBy: { creadoEn: "desc" },
    take: 200,
    include: {
      contrataciones: {
        orderBy: { creadaEn: "desc" },
        take: 10,
        include: { seccion: true, subSeccion: true },
      },
    },
  });

  return NextResponse.json(items);
}
