'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ProductosGanaderosPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    precioCoste: '',
    margen: '',
    descuento: '',
    imagenUrl: ''
  })

  const [productos, setProductos] = useState([])

  const fetchProductos = async () => {
    const res = await fetch('/api/productos-ganaderos')
    const data = await res.json()
    setProductos(data)
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/productos-ganaderos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          precioCoste: parseFloat(form.precioCoste),
          margen: parseFloat(form.margen),
          descuento: form.descuento ? parseFloat(form.descuento) : null
        })
      })

      if (!res.ok) throw new Error('Error al guardar')
      alert('Producto guardado correctamente')
      setForm({
        nombre: '',
        descripcion: '',
        categoria: '',
        precioCoste: '',
        margen: '',
        descuento: '',
        imagenUrl: ''
      })
      fetchProductos()
    } catch (error) {
      alert('Error al guardar el producto')
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return <p className="text-center p-10 text-red-600 font-semibold">Acceso no autorizado</p>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-[#004e89]">Gestión de Productos Ganaderos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 bg-gray-100 p-6 rounded-xl shadow">
        <div className="space-y-3">
          <Input placeholder="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
          <Input placeholder="Categoría (Ej: Plásticos y Mallas)" name="categoria" value={form.categoria} onChange={handleChange} />
          <Input placeholder="Precio Coste (€)" name="precioCoste" type="number" value={form.precioCoste} onChange={handleChange} />
          <Input placeholder="Margen (%)" name="margen" type="number" value={form.margen} onChange={handleChange} />
          <Input placeholder="Descuento (%) opcional" name="descuento" type="number" value={form.descuento} onChange={handleChange} />
          <Input placeholder="URL imagen producto" name="imagenUrl" value={form.imagenUrl} onChange={handleChange} />
        </div>
        <Textarea placeholder="Descripción" name="descripcion" value={form.descripcion} onChange={handleChange} rows={7} />
      </div>

      <Button onClick={handleSubmit} className="mb-10 bg-[#004e89] hover:bg-[#00325f] text-white">
        Guardar Producto
      </Button>

      <h2 className="text-xl font-semibold mb-4">Productos Registrados</h2>

      {productos.length === 0 ? (
        <p className="text-gray-500">No hay productos aún.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="min-w-full bg-white">
            <thead className="bg-[#004e89] text-white">
              <tr>
                <th className="py-2 px-4 text-left">Nombre</th>
                <th className="py-2 px-4 text-left">Categoría</th>
                <th className="py-2 px-4 text-left">Coste</th>
                <th className="py-2 px-4 text-left">Margen</th>
                <th className="py-2 px-4 text-left">Descuento</th>
                <th className="py-2 px-4 text-left">PVP</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p: any) => {
                const pvpBase = p.precioCoste * (1 + p.margen / 100)
                const pvpFinal = p.descuento ? pvpBase * (1 - p.descuento / 100) : pvpBase
                return (
                  <tr key={p.id} className="border-b">
                    <td className="py-2 px-4">{p.nombre}</td>
                    <td className="py-2 px-4">{p.categoria}</td>
                    <td className="py-2 px-4">{p.precioCoste.toFixed(2)} €</td>
                    <td className="py-2 px-4">{p.margen} %</td>
                    <td className="py-2 px-4">{p.descuento ? `${p.descuento} %` : '-'}</td>
                    <td className="py-2 px-4 font-bold text-green-700">{pvpFinal.toFixed(2)} €</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
