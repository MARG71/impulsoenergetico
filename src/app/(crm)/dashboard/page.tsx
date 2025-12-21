'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

type Lead = any
type Comparativa = any
type Agente = any
type Lugar = any
type Oferta = any

type RangoDias = 0 | 1 | 7 | 30 // 0 = todo

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const role = (session?.user as any)?.role as
    | 'SUPERADMIN'
    | 'ADMIN'
    | 'AGENTE'
    | 'LUGAR'
    | 'CLIENTE'
    | undefined

  // ✅ SUPERADMIN puede entrar en modo tenant con ?adminId=...
  const adminIdParam = searchParams?.get('adminId')
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null
  const isValidAdminContext = Number.isFinite(adminIdContext) && (adminIdContext as number) > 0

  const [comparativas, setComparativas] = useState<Comparativa[]>([])
  const [agentes, setAgentes] = useState<Agente[]>([])
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rangoDias, setRangoDias] = useState<RangoDias>(1) // por defecto: HOY

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true)

        // ✅ SUPERADMIN: si hay ?adminId=... pedimos dashboard filtrado
        const qs =
          role === 'SUPERADMIN' && isValidAdminContext
            ? `?adminId=${adminIdContext}`
            : ''

        const res = await fetch(`/api/dashboard${qs}`, { cache: 'no-store' })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Error cargando dashboard')
        }

        const data = await res.json()

        setComparativas(Array.isArray(data?.comparativas) ? data.comparativas : [])
        setAgentes(Array.isArray(data?.agentes) ? data.agentes : [])
        setLugares(Array.isArray(data?.lugares) ? data.lugares : [])
        setLeads(Array.isArray(data?.leads) ? data.leads : [])
        setOfertas(Array.isArray(data?.ofertas) ? data.ofertas : [])

        setError(null)
      } catch (err: any) {
        console.error('Error cargando datos:', err)
        setError(err.message || 'Error al cargar datos del dashboard')
      } finally {
        setCargando(false)
      }
    }

    // Re-carga cuando cambia el rol o el adminIdContext (SUPERADMIN)
    cargarDatos()
  }, [role, adminIdContext, isValidAdminContext])

  const obtenerFecha = (item: any): Date | null => {
    const raw =
      item?.creadoEn || item?.createdAt || item?.fecha || item?.fechaRegistro || null
    if (!raw) return null
    const d = new Date(raw)
    return isNaN(d.getTime()) ? null : d
  }

  const estaEnRango = (item: any): boolean => {
    if (rangoDias === 0) return true
    const fecha = obtenerFecha(item)
    if (!fecha) return false

    const ahora = new Date()
    const inicio = new Date()

    if (rangoDias === 1) {
      inicio.setHours(0, 0, 0, 0)
      const fin = new Date()
      fin.setHours(23, 59, 59, 999)
      return fecha >= inicio && fecha <= fin
    }

    inicio.setDate(ahora.getDate() - (rangoDias - 1))
    inicio.setHours(0, 0, 0, 0)
    return fecha >= inicio && fecha <= ahora
  }

  const resumen = useMemo(() => {
    const leadsRango = leads.filter(estaEnRango)
    const comparativasRango = comparativas.filter(estaEnRango)

    const leadsDesdeQR = leadsRango.filter((lead) => !!(lead as any).qrId)

    const comparativasLuz = comparativasRango.filter(
      (c: any) =>
        c?.tipoServicio === 'luz' ||
        c?.tipoServicio === 'LUZ' ||
        c?.tipoTarifa === 'luz' ||
        c?.tipoTarifa === 'LUZ'
    )
    const comparativasGas = comparativasRango.filter(
      (c: any) =>
        c?.tipoServicio === 'gas' ||
        c?.tipoServicio === 'GAS' ||
        c?.tipoTarifa === 'gas' ||
        c?.tipoTarifa === 'GAS'
    )
    const comparativasTel = comparativasRango.filter(
      (c: any) =>
        c?.tipoServicio === 'telefonia' ||
        c?.tipoServicio === 'telefonía' ||
        c?.tipoServicio === 'TEL' ||
        c?.tipoTarifa === 'telefonia' ||
        c?.tipoTarifa === 'TEL'
    )
    const comparativasSeguros = comparativasRango.filter(
      (c: any) =>
        c?.tipoServicio === 'seguros' ||
        c?.tipoServicio === 'SEG' ||
        c?.tipoTarifa === 'seguros'
    )

    const comparativasOtras = comparativasRango.filter((c: any) => {
      const t = (c?.tipoServicio || c?.tipoTarifa || '').toString().toLowerCase()
      return t && !['luz', 'gas', 'telefonia', 'telefonía', 'tel', 'seguros'].includes(t)
    })

    type Evento = {
      tipo: 'lead' | 'comparativa'
      fecha: Date
      descripcion: string
      detalle: string
      id: number | string
    }

    const eventos: Evento[] = []

    for (const lead of leads) {
      const fecha = obtenerFecha(lead)
      if (!fecha || !estaEnRango(lead)) continue

      const agenteNombre = lead?.agente?.nombre || 'Sin agente'
      const lugarNombre = lead?.lugar?.nombre || 'Sin lugar'
      const vieneDeQR = !!lead?.qrId

      eventos.push({
        tipo: 'lead',
        fecha,
        id: lead.id,
        descripcion: vieneDeQR ? `Nuevo registro desde QR` : `Nuevo registro de cliente`,
        detalle: `${
          lead?.nombre || 'Cliente sin nombre'
        } · Agente: ${agenteNombre} · Lugar: ${lugarNombre}`,
      })
    }

    for (const comp of comparativas) {
      const fecha = obtenerFecha(comp)
      if (!fecha || !estaEnRango(comp)) continue

      const tipoServicio = comp?.tipoServicio || comp?.tipoTarifa || 'Servicio'
      const nombreCliente = comp?.cliente?.nombre || comp?.nombreCliente || 'Cliente sin nombre'

      eventos.push({
        tipo: 'comparativa',
        fecha,
        id: comp.id,
        descripcion: `Comparativa de ${tipoServicio}`,
        detalle: nombreCliente,
      })
    }

    eventos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

    return {
      leadsRango,
      comparativasRango,
      leadsDesdeQR,
      comparativasLuz,
      comparativasGas,
      comparativasTel,
      comparativasSeguros,
      comparativasOtras,
      eventos: eventos.slice(0, 30),
    }
  }, [leads, comparativas, rangoDias])

  const formatearFechaCorta = (fecha: Date) => {
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const tituloRango =
    rangoDias === 1
      ? 'Hoy'
      : rangoDias === 7
      ? 'Últimos 7 días'
      : rangoDias === 30
      ? 'Últimos 30 días'
      : 'Todo el histórico'

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-4 py-8">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">

        {/* ✅ BANDA SUPERADMIN (modo tenant) */}
        {role === 'SUPERADMIN' && isValidAdminContext && (
          <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-white">
                <div className="text-sm font-extrabold uppercase tracking-wider text-emerald-200">
                  Modo tenant activado
                </div>
                <div className="text-white/90 font-semibold mt-1">
                  Estás viendo datos del admin (tenant) <span className="font-extrabold text-white">#{adminIdContext}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/admins`)}
                  className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-[13px] font-extrabold text-white transition"
                >
                  Cambiar admin
                </button>
                <button
                  onClick={() => router.push(`/dashboard`)}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition"
                >
                  Volver a global
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CABECERA */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-fuchsia-500/20 via-amber-400/10 to-emerald-400/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.45)]">
          <div className="rounded-3xl bg-slate-950/95 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Centro de Control IMPULSO ENERGÉTICO
              </h1>
              <p className="mt-1 text-[14px] md:text-lg font-semibold text-slate-300 max-w-2xl">
                Visión global de lo que hacen los clientes
                <span className="font-semibold text-emerald-300">
                  {' '}
                  (QR, registros, comparativas)
                </span>{' '}
                y accesos rápidos a la gestión.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="text-[13px] font-extrabold uppercase tracking-wide text-slate-400">
                Ver actividad de
              </span>
              <div className="flex flex-wrap gap-2">
                <Chip activo={rangoDias === 1} onClick={() => setRangoDias(1)} label="Hoy" />
                <Chip activo={rangoDias === 7} onClick={() => setRangoDias(7)} label="7 días" />
                <Chip activo={rangoDias === 30} onClick={() => setRangoDias(30)} label="30 días" />
                <Chip activo={rangoDias === 0} onClick={() => setRangoDias(0)} label="Todo" variante="dark" />
              </div>
            </div>
          </div>
        </div>

        {cargando && (
          <div className="p-6 text-center text-slate-300 text-sm rounded-2xl bg-slate-900/70 border border-slate-800">
            Cargando datos...
          </div>
        )}

        {error && !cargando && (
          <div className="p-4 mb-4 text-center text-sm text-red-200 bg-red-900/60 border border-red-700 rounded-2xl">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <>
            {/* KPIs */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <KpiCard
                titulo="Leads nuevos"
                valor={resumen.leadsRango.length}
                descripcion={`Registros en ${tituloRango.toLowerCase()}`}
                color="from-emerald-500 to-emerald-400"
                onClick={() => router.push('/pipeline-agentes')}
              />
              <KpiCard
                titulo="Leads desde QR"
                valor={resumen.leadsDesdeQR.length}
                descripcion="Clientes que han entrado por QR"
                color="from-sky-500 to-blue-500"
                onClick={() => router.push('/pipeline-agentes')}
              />
              <KpiCard
                titulo="Comparativas"
                valor={resumen.comparativasRango.length}
                descripcion="Luz · Gas · Telefonía · Seguros"
                color="from-orange-500 to-amber-400"
                onClick={() => router.push('/dashboard/historial')}
              />
              <KpiCard
                titulo="Lugares activos"
                valor={lugares.length}
                descripcion="Negocios con QR o clientes vinculados"
                color="from-lime-500 to-emerald-400"
                onClick={() => router.push('/lugares')}
              />
              <KpiCard
                titulo="Agentes activos"
                valor={agentes.length}
                descripcion="Comerciales gestionando clientes"
                color="from-fuchsia-500 to-pink-500"
                onClick={() => router.push('/agentes')}
              />
            </section>

            {/* ACTIVIDAD POR TIPO */}
            <section className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5 gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Actividad por tipo de servicio
                  </h2>
                  <p className="text-[13px] md:text-[14px] font-semibold text-slate-300 mt-1">
                    Comparativas realizadas en{' '}
                    <span className="font-semibold text-emerald-300">
                      {tituloRango.toLowerCase()}
                    </span>{' '}
                    según servicio.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/historial')}
                  className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/30"
                >
                  Ir a gestión de comparativas
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 text-xs">
                <ServicioCard titulo="Luz" valor={resumen.comparativasLuz.length} subtitulo="Comparativas de electricidad" tono="bg-orange-50/90 border-orange-200 text-orange-900" />
                <ServicioCard titulo="Gas" valor={resumen.comparativasGas.length} subtitulo="Comparativas de gas" tono="bg-amber-50/90 border-amber-200 text-amber-900" />
                <ServicioCard titulo="Telefonía" valor={resumen.comparativasTel.length} subtitulo="Móvil, fibra, etc." tono="bg-sky-50/90 border-sky-200 text-sky-900" />
                <ServicioCard titulo="Seguros" valor={resumen.comparativasSeguros.length} subtitulo="Seguros energéticos / hogar" tono="bg-violet-50/90 border-violet-200 text-violet-900" />
                <ServicioCard titulo="Otros" valor={resumen.comparativasOtras.length} subtitulo="Otros servicios" tono="bg-slate-50/90 border-slate-200 text-slate-900" />
              </div>
            </section>

            {/* ACTIVIDAD + RESUMEN */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <h2 className="text-xl font-semibold text-white">
                    Actividad de clientes ({tituloRango})
                  </h2>
                  <button
                    onClick={() => router.push('/pipeline-agentes')}
                    className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/30"
                  >
                    Ver pipeline completo
                  </button>
                </div>

                {resumen.eventos.length === 0 ? (
                  <p className="text-sm text-slate-300">
                    No hay actividad registrada en este periodo.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
                    {resumen.eventos.map((ev, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2"
                      >
                        <div className="mt-1">
                          {ev.tipo === 'lead' ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[13px] font-extrabold text-slate-950 shadow-lg shadow-emerald-500/40">
                              QR
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-[13px] font-extrabold text-slate-950 shadow-lg shadow-orange-500/40">
                              C
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-50 truncate">
                              {ev.descripcion}
                            </p>
                            <span className="text-[13px] font-extrabold text-slate-400 whitespace-nowrap">
                              {formatearFechaCorta(ev.fecha)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 truncate mt-0.5">
                            {ev.detalle}
                          </p>
                        </div>

                        <div className="ml-2">
                          {ev.tipo === 'lead' ? (
                            <button
                              onClick={() => router.push('/pipeline-agentes')}
                              className="text-[13px] font-extrabold text-emerald-300 hover:text-emerald-100"
                            >
                              Ver lead
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/comparador?id=${ev.id}`)}
                              className="text-[13px] font-extrabold text-orange-300 hover:text-orange-100"
                            >
                              Ver comp.
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Resumen QR y registros
                </h2>
                <p className="text-xs md:text-sm text-slate-300 mb-4">
                  Aquí ves de un vistazo lo que ha entrado por QR, cuántos clientes
                  nuevos se han registrado y cuántos han llegado a hacer comparativas.
                </p>

                <div className="space-y-3">
                  <ResumenFila titulo="Clientes registrados (en rango)" valor={resumen.leadsRango.length} descripcion="Total de registros en el periodo seleccionado." />
                  <ResumenFila titulo="Clientes desde QR" valor={resumen.leadsDesdeQR.length} descripcion="Personas que han accedido desde un código QR." />
                  <ResumenFila titulo="Comparativas realizadas" valor={resumen.comparativasRango.length} descripcion="Total de comparativas creadas por esos clientes." />
                  <ResumenFila
                    titulo="Lugares con actividad"
                    valor={
                      new Set(
                        resumen.leadsRango.map((l: any) => l?.lugarId).filter(Boolean)
                      ).size
                    }
                    descripcion="Lugares / negocios que han generado movimiento."
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push('/pipeline-agentes')}
                    className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/30"
                  >
                    Gestionar leads
                  </button>
                  <button
                    onClick={() => router.push('/lugares')}
                    className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-lime-400 text-slate-950 hover:bg-lime-300 transition shadow-lg shadow-lime-400/30"
                  >
                    Ver lugares
                  </button>
                  <button
                    onClick={() => router.push('/agentes')}
                    className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 transition shadow-lg shadow-sky-500/30"
                  >
                    Ver agentes
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- Componentes de apoyo ---------- */

function Chip({
  activo,
  onClick,
  label,
  variante = "light",
}: {
  activo: boolean
  onClick: () => void
  label: string
  variante?: "light" | "dark"
}) {
  const base = "px-3.5 py-1.5 rounded-full text-[13px] font-extrabold border transition"

  if (activo) {
    return (
      <button
        onClick={onClick}
        className={[
          base,
          variante === "dark"
            ? "bg-slate-200 text-slate-950 border-slate-100 shadow"
            : "bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.35)]",
        ].join(" ")}
      >
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={[
        base,
        "bg-slate-950/60 text-slate-200 border-slate-700 hover:border-emerald-400/60 hover:text-emerald-200",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

function KpiCard({
  titulo,
  valor,
  descripcion,
  color,
  onClick,
}: {
  titulo: string
  valor: number
  descripcion: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-3xl bg-slate-900/70 border border-slate-800 p-5 text-left transition
      hover:border-emerald-400/50 hover:shadow-[0_0_34px_rgba(16,185,129,0.16)]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-extrabold uppercase tracking-wider text-slate-300">
          {titulo}
        </p>
        <span
          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full text-slate-950 bg-gradient-to-r ${color} shadow`}
        >
          Ver gestión
        </span>
      </div>

      <div className="mt-4">
        <p className="text-5xl font-extrabold text-white leading-none">{valor}</p>
        <p className="text-[13px] md:text-[14px] font-semibold text-slate-300 mt-2">
          {descripcion}
        </p>
      </div>
    </button>
  )
}

function ServicioCard({
  titulo,
  valor,
  subtitulo,
  tono,
}: {
  titulo: string
  valor: number
  subtitulo: string
  tono: string
}) {
  return (
    <div className={`rounded-2xl px-4 py-3 border ${tono}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold">{titulo}</span>
        <span className="text-2xl font-extrabold">{valor}</span>
      </div>
      <span className="mt-1 block text-[13px] font-extrabold opacity-80">{subtitulo}</span>
    </div>
  )
}

function ResumenFila({
  titulo,
  valor,
  descripcion,
}: {
  titulo: string
  valor: number
  descripcion: string
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-slate-950/70 border border-slate-800 px-4 py-3">
      <div className="flex-1">
        <p className="text-xs font-extrabold text-slate-50">{titulo}</p>
        <p className="text-[13px] font-extrabold text-slate-300 mt-0.5">{descripcion}</p>
      </div>
      <p className="text-2xl font-extrabold text-emerald-300 ml-2">{valor}</p>
    </div>
  )
}
