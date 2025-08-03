import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// PATCH: Editar producto existente por ID (solo ADMIN)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      id, // Este id debe venir dentro del body, ya que Next.js 15 no admite params
      nombre,
      descripcion,
      categoria,
      precioCoste,
      margen,
      descuento,
      imagenUrl,
      activo
    } = body

    const precioPVP = precioCoste + (precioCoste * margen / 100)
    const precioFinal = descuento
      ? precioPVP - (precioPVP * descuento / 100)
      : precioPVP

    const productoActualizado = await prisma.productoGanadero.update({
      where: { id },
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
        activo
      }
    })

    return NextResponse.json(productoActualizado)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

