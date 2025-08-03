import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = params
  const data = await req.json()

  try {
    const productoActual = await prisma.productoGanadero.findUnique({
      where: { id }
    })

    if (!productoActual) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Si se actualizan márgenes, recalculamos precios
    let precioPVP = productoActual.precioPVP
    let precioFinal = productoActual.precioFinal

    if (data.precioCoste !== undefined && data.margen !== undefined) {
      precioPVP = data.precioCoste + (data.precioCoste * data.margen / 100)
      if (data.descuento !== undefined) {
        precioFinal = precioPVP - (precioPVP * data.descuento / 100)
      } else {
        precioFinal = precioPVP
      }
    }

    const productoActualizado = await prisma.productoGanadero.update({
      where: { id },
      data: {
        ...data,
        precioPVP,
        precioFinal
      }
    })

    return NextResponse.json(productoActualizado)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}
