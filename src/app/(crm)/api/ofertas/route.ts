import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')
  const destacada = searchParams.get('destacada')

  const where: any = { activa: true }
  if (tipo) where.tipo = tipo
  if (destacada) where.destacada = destacada === 'true'

  const ofertas = await prisma.oferta.findMany({
    where,
    orderBy: { creadaEn: 'desc' },
  })

  return NextResponse.json(ofertas)
}

export async function POST(req: Request) {
  const data = await req.json()

  const nueva = await prisma.oferta.create({ data })

  return NextResponse.json(nueva)
}

export async function PUT(req: Request) {
  const data = await req.json()
  const { id, ...resto } = data

  const actualizada = await prisma.oferta.update({
    where: { id },
    data: resto,
  })

  return NextResponse.json(actualizada)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()

  await prisma.oferta.delete({
    where: { id },
  })

  return NextResponse.json({ ok: true })
}
