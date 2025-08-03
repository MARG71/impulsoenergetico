'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CRMClienteLayout from '../CRMClienteLayout'

export default function DashboardPage() {
  const router = useRouter()

  const [comparativas, setComparativas] = useState<any[]>([])
  const [agentes, setAgentes] = useState<any[]>([])
  const [lugares, setLugares] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [ofertas, setOfertas] = useState<any[]>([])

  const [busquedaComparativas, setBusquedaComparativas] = useState('')
  const [busquedaAgentes, setBusquedaAgentes] = useState('')
  const [busquedaLugares, setBusquedaLugares] = useState('')
  const [busquedaLeads, setBusquedaLeads] = useState('')

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resC, resA, resL, resLeads, resOfertas] = await Promise.all([
          fetch('/api/comparativas'),
          fetch('/api/agentes'),
          fetch('/api/lugares'),
          fetch('/api/leads'),
          fetch('/api/ofertas'),
        ])
        const [dataC, dataA, dataL, dataLeads, dataOfertas] = await Promise.all([
          resC.json(),
          resA.json(),
          resL.json(),
          resLeads.json(),
          resOfertas.json(),
        ])
        setComparativas(Array.isArray(dataC) ? dataC : [])
        setAgentes(Array.isArray(dataA) ? dataA : [])
        setLugares(Array.isArray(dataL) ? dataL : [])
        setLeads(Array.isArray(dataLeads) ? dataLeads : [])
        setOfertas(Array.isArray(dataOfertas) ? dataOfertas : [])
      } catch (err) {
        console.error('Error cargando datos:', err)
      }
    }
    cargarDatos()
  }, [])

  const filtrar = (array: any[], campos: string[], busqueda: string) => {
    return array.filter((item) =>
      campos
        .map((campo) => campo.split('.').reduce((acc, key) => acc?.[key], item) || '')
        .join(' ')
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    )
  }

  const comparativasFiltradas = filtrar(
    comparativas,
    ['cliente.nombre', 'nombreTarifa', 'tipoTarifa', 'agente.nombre'],
    busquedaComparativas
  )
  const agentesFiltrados = filtrar(agentes, ['nombre', 'email', 'telefono'], busquedaAgentes)
  const lugaresFiltrados = filtrar(lugares, ['nombre', 'direccion', 'agente.nombre'], busquedaLugares)
  const leadsFiltrados = filtrar(leads, ['nombre', 'email', 'telefono', 'agente.nombre', 'lugar.nombre'], busquedaLeads)

  const Bloque = ({ titulo, color, datos, campos, encabezados, busqueda, setBusqueda, onVer }: any) => (
    <div className={`${color} text-white p-4 rounded shadow-md mb-6 w-full`}>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">{titulo}</h2>
        <p className="text-xl font-bold">{datos.length}</p>
      </div>
      {campos.length > 0 && (
        <input
          type="text"
          placeholder={`Buscar en ${titulo.toLowerCase()}...`}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full p-2 mb-3 rounded text-black bg-white placeholder-gray-500"
        />
      )}
      {campos.length > 0 ? (
        <div className="bg-white text-black rounded max-h-64 overflow-y-auto">
          {datos.length === 0 ? (
            <div className="p-2 text-sm text-gray-600">No hay registros.</div>
          ) : (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] p-2 font-semibold text-sm bg-gray-200">
                {encabezados.map((enc: string, i: number) => (
                  <div key={i}>{enc}</div>
                ))}
                <div className="text-right pr-2">Acción</div>
              </div>

              {datos.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] p-2 text-sm items-center border-t border-gray-200"
                >
                  {campos.map((campo: string, i: number) => {
                    const valor = campo.split('.').reduce((acc, key) => acc?.[key], item) || '—'
                    return <div key={i}>{valor}</div>
                  })}
                  <div className="text-right">
                    <button
                      className="ml-2 text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                      onClick={() => onVer(item.id)}
                    >
                      Ver / Editar
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 flex justify-end">
          <button
            className="bg-white text-black px-4 py-2 rounded shadow hover:bg-gray-200 text-sm font-semibold"
            onClick={() => onVer()}
          >
            Ver / Editar Ofertas
          </button>
        </div>
      )}
    </div>
  )

  return (
    <CRMClienteLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">
          Panel de Administración IMPULSO ENERGÉTICO
        </h1>

        <Bloque
          titulo="Comparativas de Luz"
          color="bg-orange-500"
          datos={comparativasFiltradas}
          campos={['cliente.nombre', 'nombreTarifa', 'tipoTarifa', 'agente.nombre']}
          encabezados={['Cliente', 'Tarifa', 'Tipo', 'Agente']}
          busqueda={busquedaComparativas}
          setBusqueda={setBusquedaComparativas}
          onVer={(id: number) => router.push(`/dashboard/comparativas/${id}`)}
        />

        <Bloque
          titulo="Agentes IMPULSO ENERGÉTICO"
          color="bg-blue-800"
          datos={agentesFiltrados}
          campos={['nombre', 'email', 'telefono']}
          encabezados={['Nombre', 'Email', 'Teléfono']}
          busqueda={busquedaAgentes}
          setBusqueda={setBusquedaAgentes}
          onVer={(id: number) => router.push(`/dashboard/agentes/${id}`)}
        />

        <Bloque
          titulo="Lugares CLIENTES ASOCIADOS"
          color="bg-lime-500"
          datos={lugaresFiltrados}
          campos={['nombre', 'direccion', 'agente.nombre']}
          encabezados={['Nombre', 'Dirección', 'Agente']}
          busqueda={busquedaLugares}
          setBusqueda={setBusquedaLugares}
          onVer={(id: number) => router.push(`/dashboard/lugares/${id}`)}
        />

        <Bloque
          titulo="Leads Registrados"
          color="bg-teal-600"
          datos={leadsFiltrados}
          campos={['nombre', 'email', 'telefono', 'agente.nombre', 'lugar.nombre']}
          encabezados={['Nombre', 'Email', 'Teléfono', 'Agente', 'Lugar']}
          busqueda={busquedaLeads}
          setBusqueda={setBusquedaLeads}
          onVer={(id: number) => router.push(`/dashboard/leads/${id}`)}
        />

        <Bloque
          titulo="Ofertas Promocionales"
          color="bg-fuchsia-600"
          datos={ofertas}
          campos={[]} // no mostramos tabla ni buscador aquí
          encabezados={[]}
          busqueda={''}
          setBusqueda={() => {}}
          onVer={() => router.push('/ofertas')}
        />
      </div>
    </CRMClienteLayout>
  )
}
