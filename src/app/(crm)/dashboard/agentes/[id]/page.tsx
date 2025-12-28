'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

export default function EditarAgenteDashboard() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  // id del agente desde la ruta /dashboard/agentes/[id]
  const rawId = (params as any)?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  // adminId si estamos en modo tenant: /dashboard/agentes/[id]?adminId=1
  const adminIdParam = searchParams.get('adminId')
  const adminId = adminIdParam && !Array.isArray(adminIdParam) ? adminIdParam : null
  const adminQuery = adminId ? `?adminId=${adminId}` : ''

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // helper para volver respetando el tenant
  const pushTenant = (href: string) => {
    if (adminId) {
      const hasQuery = href.includes('?')
      router.push(`${href}${hasQuery ? '&' : '?'}adminId=${adminId}`)
    } else {
      router.push(href)
    }
  }

  useEffect(() => {
    if (!id) return

    const cargarAgente = async () => {
      try {
        const res = await fetch(`/api/agentes/${id}${adminQuery}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Error cargando datos del agente')
          return
        }

        setNombre(data.nombre || '')
        setEmail(data.email || '')
      } catch (e) {
        console.error(e)
        setError('Error de conexión al cargar agente')
      } finally {
        setCargando(false)
      }
    }

    cargarAgente()
  }, [id, adminQuery])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    try {
      const res = await fetch(`/api/agentes/${id}${adminQuery}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        alert(data.error || 'Error al actualizar el agente')
        return
      }

      alert('Agente actualizado correctamente')
      pushTenant('/dashboard') // volvemos al dashboard del tenant si aplica
    } catch (e) {
      console.error(e)
      alert('Error de conexión al actualizar el agente')
    }
  }

  if (cargando) {
    return <p className="text-center mt-10">Cargando datos del agente...</p>
  }

  if (error) {
    return (
      <p className="text-center mt-10 text-red-300 font-semibold">
        {error}
      </p>
    )
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-slate-950 border border-slate-800 rounded-2xl shadow-lg text-slate-50">
      <h2 className="text-2xl font-extrabold mb-4 text-emerald-300">
        Editar agente desde dashboard
      </h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Nombre</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-sm"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input
            type="email"
            className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex justify-between gap-2 pt-2">
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded font-semibold text-sm"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded font-semibold text-sm"
            onClick={() => pushTenant('/dashboard')}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
