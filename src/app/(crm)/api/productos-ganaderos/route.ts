import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// GET: Obtener todos los productos
export async function GET() {
  try {
    const productos = await prisma.productoGanadero.findMany({
      orderBy: { creadoEn: 'desc' }
    })
    return NextResponse.json(productos)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

// POST: Crear nuevo producto (solo ADMIN)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      nombre,
      descripcion,
      categoria,
      precioCoste,
      margen,
      descuento,
      imagenUrl
    } = body

    const precioPVP = precioCoste + (precioCoste * margen / 100)
    const precioFinal = descuento
      ? precioPVP - (precioPVP * descuento / 100)
      : precioPVP

    const producto = await prisma.productoGanadero.create({
      data: {
        nombre,
        descripcion,
        categoria,
        precioCoste,
        margen,
        precioPVP,
        descuento,
        precioFinal,
        imagenUrl,
        activo: true
      }
    })

    return NextResponse.json(producto)
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
