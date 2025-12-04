'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import CRMClienteLayout from '../CRMClienteLayout'

type Lead = any
type Comparativa = any
type Agente = any
type Lugar = any
type Oferta = any

type RangoDias = 0 | 1 | 7 | 30 // 0 = todo

export default function DashboardPage() {
  const router = useRouter()

  const [comparativas, setComparativas] = useState<Comparativa[]>([])
  const [agentes, setAgentes] = useState<Agente[]>([])
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rangoDias, setRangoDias] = useState<RangoDias>(1) // por defecto: HOY

  // 👇 Función auxiliar para normalizar respuestas {clave: []} o []
  const normalizarLista = (data: any, key?: string) => {
    if (key && Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(data)) return data
    return []
  }

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true)
        const [resC, resA, resL, resLeads, resOfertas] = await Promise.all([
          fetch('/api/comparativas'),
          fetch('/api/agentes'),
          fetch('/api/lugares'),
          fetch('/api/leads'),
          fetch('/api/ofertas'),
        ])

        if (!resC.ok || !resA.ok || !resL.ok || !resLeads.ok || !resOfertas.ok) {
          throw new Error('Error al cargar alguna de las fuentes de datos')
        }

        const [dataC, dataA, dataL, dataLeads, dataOfertas] = await Promise.all([
          resC.json(),
          resA.json(),
          resL.json(),
          resLeads.json(),
          resOfertas.json(),
        ])

        setComparativas(normalizarLista(dataC, 'comparativas'))
        setAgentes(normalizarLista(dataA, 'agentes'))
        setLugares(normalizarLista(dataL, 'lugares'))
        setLeads(normalizarLista(dataLeads, 'leads'))
        setOfertas(normalizarLista(dataOfertas, 'ofertas'))
        setError(null)
      } catch (err: any) {
        console.error('Error cargando datos:', err)
        setError(err.message || 'Error al cargar datos del dashboard')
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  // 🔎 Función para obtener la fecha del registro (ajusta nombres de campos aquí)
  const obtenerFecha = (item: any): Date | null => {
    const raw =
      item?.creadoEn || item?.createdAt || item?.fecha || item?.fechaRegistro || null // ⚠️ AJUSTA a tu schema
    if (!raw) return null
    const d = new Date(raw)
    return isNaN(d.getTime()) ? null : d
  }

  // ⏱️ Filtrado por rango de días: hoy, 7 días, 30 días, todo
  const estaEnRango = (item: any): boolean => {
    if (rangoDias === 0) return true // todo
    const fecha = obtenerFecha(item)
    if (!fecha) return false

    const ahora = new Date()
    const inicio = new Date()
    // Rango: hoy, últimos 7 días, últimos 30 días
    if (rangoDias === 1) {
      // solo hoy
      inicio.setHours(0, 0, 0, 0)
      const fin = new Date()
      fin.setHours(23, 59, 59, 999)
      return fecha >= inicio && fecha <= fin
    }

    inicio.setDate(ahora.getDate() - (rangoDias - 1))
    inicio.setHours(0, 0, 0, 0)
    return fecha >= inicio && fecha <= ahora
  }

  // 💡 KPIs y métricas calculadas
  const resumen = useMemo(() => {
    // Filtrar por rango de días
    const leadsRango = leads.filter(estaEnRango)
    const comparativasRango = comparativas.filter(estaEnRango)

    // Leads que vienen de QR (⚠️ ajusta si usas otro campo: qrId, qrID, qr, etc.)
    const leadsDesdeQR = leadsRango.filter((lead) => !!(lead as any).qrId)

    // Comparativas por tipo de servicio
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

    // Otras comparativas (si las hubiera)
    const comparativasOtras = comparativasRango.filter((c: any) => {
      const t = (c?.tipoServicio || c?.tipoTarifa || '').toString().toLowerCase()
      return t && !['luz', 'gas', 'telefonia', 'telefonía', 'tel', 'seguros'].includes(t)
    })

    // 📜 Construimos una "línea temporal" de eventos
    type Evento = {
      tipo: 'lead' | 'comparativa'
      fecha: Date
      descripcion: string
      detalle: string
      id: number | string
    }

    const eventos: Evento[] = []

    // Eventos de leads (registros nuevos)
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
        descripcion: vieneDeQR
          ? `Nuevo registro desde QR`
          : `Nuevo registro de cliente`,
        detalle: `${
          lead?.nombre || 'Cliente sin nombre'
        } · Agente: ${agenteNombre} · Lugar: ${lugarNombre}`,
      })
    }

    // Eventos de comparativas
    for (const comp of comparativas) {
      const fecha = obtenerFecha(comp)
      if (!fecha || !estaEnRango(comp)) continue

      const tipoServicio = comp?.tipoServicio || comp?.tipoTarifa || 'Servicio'
      const nombreCliente =
        comp?.cliente?.nombre || comp?.nombreCliente || 'Cliente sin nombre'

      eventos.push({
        tipo: 'comparativa',
        fecha,
        id: comp.id,
        descripcion: `Comparativa de ${tipoServicio}`,
        detalle: nombreCliente,
      })
    }

    // Ordenar eventos por fecha descendente
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
      eventos: eventos.slice(0, 30), // mostramos máximo 30 eventos en el dashboard
    }
  }, [leads, comparativas, rangoDias])

  // 🧰 Pequeño formateador de fechas
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
    <CRMClienteLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Cabecera principal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">
              Centro de Control IMPULSO ENERGÉTICO
            </h1>
            <p className="text-sm text-slate-600">
              Visión global de lo que hacen los clientes (QR, registros, comparativas) y acceso rápido a la gestión.
            </p>
          </div>

          {/* Selector de rango de fechas */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-2">Ver actividad de:</span>
            <button
              onClick={() => setRangoDias(1)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                rangoDias === 1
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setRangoDias(7)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                rangoDias === 7
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              7 días
            </button>
            <button
              onClick={() => setRangoDias(30)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                rangoDias === 30
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              30 días
            </button>
            <button
              onClick={() => setRangoDias(0)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                rangoDias === 0
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              Todo
            </button>
          </div>
        </div>

        {cargando && (
          <div className="p-4 text-center text-slate-600">Cargando datos...</div>
        )}

        {error && !cargando && (
          <div className="p-4 mb-4 text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <>
            {/* 1️⃣ KPIs principales */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <KpiCard
                titulo="Leads nuevos"
                valor={resumen.leadsRango.length}
                descripcion={`Registros de clientes en ${tituloRango.toLowerCase()}`}
                color="bg-emerald-600"
                onClick={() => router.push('/dashboard/leads')}
              />
              <KpiCard
                titulo="Leads desde QR"
                valor={resumen.leadsDesdeQR.length}
                descripcion={`Clientes que han entrado desde QR`}
                color="bg-blue-700"
                onClick={() => router.push('/dashboard/leads')}
              />
              <KpiCard
                titulo="Comparativas"
                valor={resumen.comparativasRango.length}
                descripcion={`Luz, gas, telefonía, seguros...`}
                color="bg-orange-500"
                onClick={() => router.push('/dashboard/comparativas')}
              />
              <KpiCard
                titulo="Lugares activos"
                valor={lugares.length}
                descripcion="Negocios con QR o clientes vinculados"
                color="bg-lime-600"
                onClick={() => router.push('/dashboard/lugares')}
              />
              <KpiCard
                titulo="Agentes activos"
                valor={agentes.length}
                descripcion="Comerciales gestionando clientes"
                color="bg-fuchsia-600"
                onClick={() => router.push('/dashboard/agentes')}
              />
            </section>

            {/* 2️⃣ Resumen por tipo de servicio */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Actividad por tipo de servicio
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comparativas realizadas en {tituloRango.toLowerCase()} según servicio.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/comparativas')}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  Ir a gestión de comparativas
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <ServicioCard
                  titulo="Luz"
                  valor={resumen.comparativasLuz.length}
                  subtitulo="Comparativas de electricidad"
                  tono="bg-orange-50 border-orange-200"
                />
                <ServicioCard
                  titulo="Gas"
                  valor={resumen.comparativasGas.length}
                  subtitulo="Comparativas de gas"
                  tono="bg-amber-50 border-amber-200"
                />
                <ServicioCard
                  titulo="Telefonía"
                  valor={resumen.comparativasTel.length}
                  subtitulo="Móvil, fibra, etc."
                  tono="bg-sky-50 border-sky-200"
                />
                <ServicioCard
                  titulo="Seguros"
                  valor={resumen.comparativasSeguros.length}
                  subtitulo="Seguros energéticos / hogar"
                  tono="bg-violet-50 border-violet-200"
                />
                <ServicioCard
                  titulo="Otros"
                  valor={resumen.comparativasOtras.length}
                  subtitulo="Otros servicios"
                  tono="bg-slate-50 border-slate-200"
                />
              </div>
            </section>

            {/* 3️⃣ Actividad cronológica del día / rango */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Línea temporal */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Actividad de clientes ({tituloRango})
                  </h2>
                  <button
                    onClick={() => router.push('/pipeline-agentes')}
                    className="px-4 py-2 rounded-full text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 transition"
                  >
                    Ver pipeline completo
                  </button>
                </div>

                {resumen.eventos.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No hay actividad registrada en este periodo.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {resumen.eventos.map((ev, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div className="mt-1">
                          {ev.tipo === 'lead' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                              QR
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-[11px] font-bold text-white">
                              C
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {ev.descripcion}
                            </p>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                              {formatearFechaCorta(ev.fecha)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 truncate mt-0.5">
                            {ev.detalle}
                          </p>
                        </div>
                        <div className="ml-2">
                          {ev.tipo === 'lead' ? (
                            <button
                              onClick={() =>
                                router.push(`/dashboard/leads/${ev.id}`)
                              }
                              className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900"
                            >
                              Ver lead
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                router.push(`/comparador?id=${ev.id}`)
                              }
                              className="text-[10px] font-semibold text-orange-600 hover:text-orange-800"
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

              {/* Resumen rápido de QR / registros */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Resumen QR y registros
                </h2>
                <p className="text-xs text-slate-500 mb-3">
                  Aquí ves de un vistazo lo que ha entrado por QR, cuántos clientes nuevos se han registrado y cuántos han llegado a hacer comparativas.
                </p>

                <div className="space-y-3">
                  <ResumenFila
                    titulo="Clientes registrados (en rango)"
                    valor={resumen.leadsRango.length}
                    descripcion="Total de registros en el periodo seleccionado."
                  />
                  <ResumenFila
                    titulo="Clientes desde QR"
                    valor={resumen.leadsDesdeQR.length}
                    descripcion="Personas que han accedido desde un código QR."
                  />
                  <ResumenFila
                    titulo="Comparativas realizadas"
                    valor={resumen.comparativasRango.length}
                    descripcion="Total de comparativas creadas por esos clientes."
                  />
                  <ResumenFila
                    titulo="Lugares con actividad"
                    valor={
                      new Set(
                        resumen.leadsRango
                          .map((l: any) => l?.lugarId)
                          .filter(Boolean)
                      ).size
                    }
                    descripcion="Lugares / negocios que han generado movimiento."
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push('/dashboard/leads')}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Gestionar leads
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/lugares')}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-lime-600 text-white hover:bg-lime-700"
                  >
                    Ver lugares
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/agentes')}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800"
                  >
                    Ver agentes
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </CRMClienteLayout>
  )
}

// 🔹 Tarjeta KPI superior
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
      className="group rounded-2xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col justify-between hover:shadow-md transition text-left"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {titulo}
        </p>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${color}`}
        >
          Ver gestión
        </span>
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold text-slate-900">{valor}</p>
        <p className="text-xs text-slate-500 mt-1">{descripcion}</p>
      </div>
    </button>
  )
}

// 🔹 Tarjeta de resumen por servicio
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
    <div
      className={`rounded-xl px-3 py-3 border ${tono} flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{titulo}</span>
        <span className="text-lg font-bold text-slate-900">{valor}</span>
      </div>
      <span className="mt-1 text-[11px] text-slate-500">{subtitulo}</span>
    </div>
  )
}

// 🔹 Fila de resumen QR / registros
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
    <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-800">{titulo}</p>
        <p className="text-[11px] text-slate-500">{descripcion}</p>
      </div>
      <p className="text-xl font-bold text-slate-900 ml-2">{valor}</p>
    </div>
  )
}
