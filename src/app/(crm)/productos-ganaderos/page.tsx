'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

export default function ProductosGanaderosPage() {
  const { data: session } = useSession()

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precioCoste: '',
    margen: '',
    descuento: '',
    imagenUrl: '',
    activo: true,
  })

  const [productos, setProductos] = useState<any[]>([])
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const fetchProductos = async () => {
    const res = await fetch('/api/productos-ganaderos')
    const data = await res.json()
    setProductos(data)
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async () => {
    const coste = parseFloat(form.precioCoste)
    const margen = parseFloat(form.margen)
    const descuento = form.descuento ? parseFloat(form.descuento) : 0

    const precioPVP = coste + (coste * margen / 100)
    const precioFinal = descuento > 0 ? precioPVP - (precioPVP * descuento / 100) : precioPVP

    try {
      const res = await fetch('/api/productos-ganaderos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion: form.descripcion,
          categoria: form.categoria,
          precioCoste: coste,
          margen,
          descuento: descuento > 0 ? descuento : null,
          precioPVP,
          precioFinal,
          imagenUrl: form.imagenUrl,
          activo: form.activo,
        })
      })

      if (!res.ok) throw new Error('Error al guardar')
      setForm({
        nombre: '',
        descripcion: '',
        categoria: '',
        precioCoste: '',
        margen: '',
        descuento: '',
        imagenUrl: '',
        activo: true,
      })
      fetchProductos()
    } catch (error) {
      alert('Error al guardar el producto')
    }
  }

  const toggleActivo = async (id: string, actual: boolean) => {
    const res = await fetch(`/api/productos-ganaderos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !actual })
    })
    if (res.ok) fetchProductos()
  }

  const cargarProducto = (p: any) => {
    setEditandoId(p.id)
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      categoria: p.categoria,
      precioCoste: p.precioCoste,
      margen: p.margen,
      descuento: p.descuento ?? '',
      imagenUrl: p.imagenUrl,
      activo: p.activo,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!session || session.user.role !== 'ADMIN') {
    return <p className="text-red-500 text-center mt-10">Acceso no autorizado</p>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-900 mb-6">Gestión de Productos Ganaderos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input placeholder="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
        <Input placeholder="Categoría (Ej: Plásticos y Mallas)" name="categoria" value={form.categoria} onChange={handleChange} />
        <Input placeholder="Precio Coste (€)" name="precioCoste" value={form.precioCoste} onChange={handleChange} type="number" />
        <Input placeholder="Margen (%)" name="margen" value={form.margen} onChange={handleChange} type="number" />
        <Input placeholder="Descuento (%) opcional" name="descuento" value={form.descuento} onChange={handleChange} type="number" />
        <Input placeholder="URL imagen producto" name="imagenUrl" value={form.imagenUrl} onChange={handleChange} />
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="activo">Activo</label>
        </div>
      </div>

      <Textarea placeholder="Descripción" name="descripcion" value={form.descripcion} onChange={handleChange} className="mb-4" />

      <Button onClick={handleSubmit}>{editandoId ? 'Actualizar' : 'Guardar'} Producto</Button>

      <hr className="my-8 border-gray-300" />

      <h2 className="text-2xl font-semibold text-green-800 mb-4">Productos registrados</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead className="bg-blue-800 text-white">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">PVP (€)</th>
              <th className="px-4 py-2">Activo</th>
              <th className="px-4 py-2">Imagen</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} className="text-sm text-gray-700 border-t">
                <td className="px-4 py-2 font-bold">{p.nombre}</td>
                <td className="px-4 py-2">{p.categoria}</td>
                <td className="px-4 py-2">{p.precioPVP.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-white text-xs ${p.activo ? 'bg-green-600' : 'bg-red-500'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {p.imagenUrl && (
                    <Image src={p.imagenUrl} alt="producto" width={40} height={40} className="rounded" />
                  )}
                </td>
                <td className="px-4 py-2 space-x-2">
                  <Button size="sm" onClick={() => cargarProducto(p)}>Editar</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleActivo(p.id, p.activo)}>
                    {p.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
