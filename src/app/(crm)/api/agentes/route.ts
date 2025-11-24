// src/app/(crm)/api/agentes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendAccessEmail } from "@/lib/sendAccessEmail";

const normPct = (v: any) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  if (Number.isNaN(n)) return undefined;
  return n > 1 ? n / 100 : n; // 15 -> 0.15
};

// GET /api/agentes?take=6&skip=0&q=texto
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Number(searchParams.get("take") ?? 6);
    const skip = Number(searchParams.get("skip") ?? 0);
    const q = searchParams.get("q")?.trim() ?? "";

    let where: Prisma.AgenteWhereInput | undefined;
    if (q) {
      where = {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { telefono: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const items = await prisma.agente.findMany({
      where,
      orderBy: { id: "desc" },
      take,
      skip,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        pctAgente: true,
      },
    });
    return NextResponse.json(items);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/agentes  { nombre, email, telefono?, pctAgente? }
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const nombre = (b?.nombre ?? "").trim();
    const email = (b?.email ?? "").trim();
    const telefono = (b?.telefono ?? "").trim();
    const pctAgente = normPct(b?.pctAgente);

    if (!nombre || !email) {
      return NextResponse.json(
        { error: "nombre y email son obligatorios" },
        { status: 400 }
      );
    }

    // 1) Comprobar que el email no existe ni en Agente ni en Usuario
    const [agenteDup, usuarioDup] = await Promise.all([
      prisma.agente.findUnique({ where: { email } }),
      prisma.usuario.findUnique({ where: { email } }),
    ]);

    if (agenteDup || usuarioDup) {
      return NextResponse.json(
        { error: "Ya existe un agente o usuario con ese email" },
        { status: 409 }
      );
    }

    // 2) Generar contraseña aleatoria y hashearla
    const plainPassword = Math.random().toString(36).slice(-10); // ej: 'k9f3a2b7xz'
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 3) Crear agente y usuario vinculados en una transacción
    const [agente, usuario] = await prisma.$transaction([
      prisma.agente.create({
        data: {
          nombre,
          email,
          telefono,
          ...(pctAgente !== undefined ? { pctAgente } : {}),
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          pctAgente: true,
        },
      }),
      prisma.usuario.create({
        data: {
          nombre,
          email,
          password: hashedPassword,
          rol: "AGENTE",
          // se rellena agenteId después con el resultado real
          // pero en transacción no podemos usar el id del otro paso directamente,
          // así que haremos un segundo paso con update si lo quieres perfecto.
        },
      }),
    ]);

    // 🔧 Opcional: si quieres guardar agenteId en Usuario,
    // puedes hacer aquí un update (fuera de la transacción anterior):
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { agenteId: agente.id },
    });

    // 4) Enviar email de acceso
    await sendAccessEmail({
      to: email,
      nombre,
      rol: "AGENTE",
      email,
      password: plainPassword,
    });

    return NextResponse.json(
      {
        agente,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Error creando agente:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
