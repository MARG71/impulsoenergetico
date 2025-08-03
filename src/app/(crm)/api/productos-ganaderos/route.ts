import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// GET: Obtener todos los productos ganaderos
export async function GET() {
  try {
    const productos = await prisma.productoGanadero.findMany({
      orderBy: { creadoEn: 'desc' }
    })
    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

// POST: Crear un nuevo producto ganadero (solo ADMIN)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const {
      nombre,
      descripcion,
      categoria,
      precioCoste,
      margen,
      descuento,
      imagenUrl
    } = await req.json()

    const precioPVP = precioCoste + (precioCoste * margen / 100)
    const precioFinal = descuento
      ? precioPVP - (precioPVP * descuento / 100)
      : precioPVP

    const nuevoProducto = await prisma.productoGanadero.create({
      data: {
        nombre,
        descripcion,
        categoria,
        precioCoste,
        margen,
        descuento,
        precioPVP,
        precioFinal,
        imagenUrl,
        activo: true
      }
    })

    return NextResponse.json(nuevoProducto)
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
