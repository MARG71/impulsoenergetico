'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Flame, Phone, Trash2, Pencil } from 'lucide-react'

type Oferta = {
  id: number
  titulo: string
  descripcion: string
  descripcionCorta: string
  tipo: 'luz' | 'gas' | 'telefonia'
  destacada: boolean
  activa: boolean
}

const fondoPorTipo: Record<string, string> = {
  luz: 'bg-[#d3fce3]',
  gas: 'bg-[#ffe9d6]',
  telefonia: 'bg-[#e3edff]',
}

const colorEtiqueta = (tipo: string) =>
  tipo === 'luz' ? 'bg-green-100 text-green-800' :
  tipo === 'gas' ? 'bg-orange-100 text-orange-800' :
  'bg-blue-100 text-blue-800'

const obtenerIcono = (tipo: string) =>
  tipo === 'luz' ? <Sparkles className="w-4 h-4 inline mr-1" /> :
  tipo === 'gas' ? <Flame className="w-4 h-4 inline mr-1" /> :
  <Phone className="w-4 h-4 inline mr-1" />

export default function GestionOfertasContenido() {
  const { data: session, status } = useSession()
  const esAdmin = session?.user?.role === 'ADMIN'

  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    descripcionCorta: '',
    tipo: 'luz',
    destacada: false,
    activa: true,
  })

  const cargarOfertas = async () => {
    try {
      const res = await fetch('/api/ofertas')
      const data = await res.json()
      setOfertas(data)
    } catch (error) {
      console.error('Error cargando ofertas:', error)
    }
  }

  const crearOferta = async () => {
    await fetch('/api/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({
      titulo: '',
      descripcion: '',
      descripcionCorta: '',
      tipo: 'luz',
      destacada: false,
      activa: true,
    })
    cargarOfertas()
  }

  const eliminarOferta = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta oferta?')) return
    await fetch(`/api/ofertas?id=${id}`, { method: 'DELETE' })
    cargarOfertas()
  }

  useEffect(() => {
    if (status === 'authenticated') {
      cargarOfertas()
    }
  }, [status])

  if (status === 'loading') return <div className="p-6 text-white">Cargando...</div>
  if (!session) return <div className="p-6 text-white">Acceso restringido. Por favor inicia sesión.</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Gestión de Ofertas</h1>

      {esAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow text-black">
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
          <Input
            placeholder="Descripción Corta"
            value={form.descripcionCorta}
            onChange={(e) => setForm({ ...form, descripcionCorta: e.target.value })}
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
            className="border rounded p-2 bg-white text-black"
          >
            <option value="luz">Luz</option>
            <option value="gas">Gas</option>
            <option value="telefonia">Telefonía</option>
          </select>
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={form.destacada}
              onChange={(e) => setForm({ ...form, destacada: e.target.checked })}
            />
            Destacada (carrusel)
          </label>
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
            />
            Oferta Activa
          </label>
          <Button
            onClick={crearOferta}
            className="w-full col-span-2 bg-green-600 hover:bg-green-700 text-white"
          >
            Crear Oferta
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ofertas.map((oferta) => {
          const tipo = oferta.tipo.toLowerCase()
          return (
            <Card key={oferta.id} className={`${fondoPorTipo[tipo]} shadow-md rounded-2xl text-black`}>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className={`text-xs px-2 py-1 inline-block rounded-full font-semibold mb-2 ${colorEtiqueta(tipo)}`}>
                    {obtenerIcono(tipo)}
                    {tipo.toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{oferta.titulo}</h3>
                  <p className="text-sm text-gray-800">{oferta.descripcionCorta || oferta.descripcion}</p>
                  {oferta.destacada && <div className="mt-1 text-orange-600 font-bold text-sm">⭐ Destacada</div>}
                  {!oferta.activa && <div className="text-red-600 text-sm font-bold">❌ Inactiva</div>}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => alert('Más información disponible próximamente')}
                    className="bg-black text-white hover:bg-gray-800 text-sm px-3 py-1"
                  >
                    Ir a la oferta
                  </Button>
                  {esAdmin && (
                    <>
                      <Button
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 text-sm px-2"
                        onClick={() => alert('Función de edición en desarrollo')}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50 text-sm px-2"
                        onClick={() => eliminarOferta(oferta.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


