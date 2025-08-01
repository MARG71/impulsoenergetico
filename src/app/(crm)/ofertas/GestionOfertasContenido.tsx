'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// ✅ Tipado de Oferta
type Oferta = {
  id: number
  titulo: string
  descripcion: string
  tipo: string
  destacada: boolean
}

export default function GestionOfertasContenido() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]) // ✅ Estado tipado
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'luz',
    destacada: false,
  })

  const cargarOfertas = async () => {
    const res = await fetch('/api/ofertas')
    const data = await res.json()
    setOfertas(data)
  }

  const crearOferta = async () => {
    await fetch('/api/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ titulo: '', descripcion: '', tipo: 'luz', destacada: false })
    cargarOfertas()
  }

  useEffect(() => {
    cargarOfertas()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Ofertas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow">
        <Input
          placeholder="Título"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        />
        <Input
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
        <select
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          className="border rounded p-2"
        >
          <option value="luz">Luz</option>
          <option value="gas">Gas</option>
          <option value="telefonia">Telefonía</option>
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.destacada}
            onChange={(e) => setForm({ ...form, destacada: e.target.checked })}
          />
          Destacada (carrusel)
        </label>
        <Button onClick={crearOferta}>Crear Oferta</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ofertas.map((oferta) => (
          <Card key={oferta.id} className="bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-semibold">{oferta.titulo}</h3>
              <p className="text-sm text-gray-700">{oferta.descripcion}</p>
              <p className="mt-2 text-xs italic">Tipo: {oferta.tipo}</p>
              {oferta.destacada && (
                <span className="text-orange-600 font-bold text-sm">⭐ Destacada</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
