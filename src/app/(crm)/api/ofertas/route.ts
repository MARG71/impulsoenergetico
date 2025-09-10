// src/app/(crm)/api/ofertas/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic' // sin cache en este endpoint

// GET /api/ofertas?tipo=luz&destacada=true&activa=true&q=texto&includeTarifa=true&take=50&skip=0
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const tipo = searchParams.get('tipo') // 'luz' | 'gas' | 'telefonia'
  const destacada = searchParams.get('destacada') // 'true' | 'false'
  const activa = searchParams.get('activa') // 'true' | 'false'
  const q = searchParams.get('q') // texto libre
  const includeTarifa = searchParams.get('includeTarifa') === 'true'

  const take = Number(searchParams.get('take') ?? 0) || undefined
  const skip = Number(searchParams.get('skip') ?? 0) || undefined

  const where: any = {}
  if (tipo) where.tipo = tipo
  if (destacada === 'true') where.destacada = true
  if (destacada === 'false') where.destacada = false
  if (activa === 'true') where.activa = true
  if (activa === 'false') where.activa = false
  if (q) {
    where.OR = [
      { titulo: { contains: q, mode: 'insensitive' } },
      { descripcion: { contains: q, mode: 'insensitive' } },
      { descripcionCorta: { contains: q, mode: 'insensitive' } },
    ]
  }

  const ofertas = await prisma.oferta.findMany({
    where,
    include: includeTarifa
      ? {
          ofertaTarifa: {
            include: {
              tramos: {
                where: { activo: true },
                orderBy: { consumoDesdeKWh: 'asc' },
              },
            },
          },
        }
      : undefined,
    orderBy: { creadaEn: 'desc' },
    take,
    skip,
  })

  // Para compatibilidad seguimos devolviendo el array “plano”
  return NextResponse.json(ofertas)
}

// POST /api/ofertas
// body: { titulo, descripcion, descripcionCorta?, tipo, destacada?, activa?, ofertaTarifaId? }
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const data: any = {
      titulo: String(body.titulo ?? ''),
      descripcion: String(body.descripcion ?? ''),
      descripcionCorta: body.descripcionCorta ?? null,
      tipo: String(body.tipo ?? 'luz'),
      destacada: !!body.destacada,
      activa: body.activa ?? true,
    }

    if (body.ofertaTarifaId != null) {
      const idNum = Number(body.ofertaTarifaId)
      data.ofertaTarifaId = Number.isFinite(idNum) ? idNum : null
    }

    const nueva = await prisma.oferta.create({
      data,
      include: { ofertaTarifa: true },
    })

    return NextResponse.json(nueva, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error creando oferta' }, { status: 400 })
  }
}

// PUT /api/ofertas
// body: { id, ...camposAActualizar }
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const id = Number(body.id)
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    const data: any = {}
    if (body.titulo !== undefined) data.titulo = String(body.titulo)
    if (body.descripcion !== undefined) data.descripcion = String(body.descripcion)
    if (body.descripcionCorta !== undefined) data.descripcionCorta = body.descripcionCorta ?? null
    if (body.tipo !== undefined) data.tipo = String(body.tipo)
    if (body.destacada !== undefined) data.destacada = !!body.destacada
    if (body.activa !== undefined) data.activa = !!body.activa
    if (body.ofertaTarifaId !== undefined) {
      const idNum = Number(body.ofertaTarifaId)
      data.ofertaTarifaId = Number.isFinite(idNum) ? idNum : null
    }

    const actualizada = await prisma.oferta.update({
      where: { id },
      data,
      include: { ofertaTarifa: true },
    })

    return NextResponse.json(actualizada)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error actualizando' }, { status: 400 })
  }
}

// DELETE /api/ofertas?id=123    ó    body: { id: 123 }
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const qId = url.searchParams.get('id')
    let id = qId ? Number(qId) : undefined

    if (!id) {
      // intentar en el body
      try {
        const body = await req.json()
        if (body?.id != null) id = Number(body.id)
      } catch { /* sin body */ }
    }

    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    await prisma.oferta.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error eliminando' }, { status: 400 })
  }
}
