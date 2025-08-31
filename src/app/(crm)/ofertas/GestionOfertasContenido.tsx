'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Flame, Phone, Trash2, Pencil, Upload, Download, Trash } from 'lucide-react'

type Oferta = {
  id: number
  titulo: string
  descripcion: string
  descripcionCorta: string
  tipo: 'luz' | 'gas' | 'telefonia'
  destacada: boolean
  activa: boolean
}

type Tramo = {
  id: number
  consumoDesdeKWh: number
  consumoHastaKWh: number | null
  comisionKwhAdmin: number | null
  comisionFijaAdmin: number | null
}

type OfertaTarifa = {
  id: number
  tipo: 'LUZ' | 'GAS' | 'TELEFONIA'
  subtipo: string
  compania: string
  nombre: string
  activa: boolean
  precioKwhP1?: number | string | null
  precioKwhP2?: number | string | null
  precioKwhP3?: number | string | null
  precioKwhP4?: number | string | null
  precioKwhP5?: number | string | null
  precioKwhP6?: number | string | null
  comisionKwhAdminBase?: number | string | null
  tramos?: Tramo[]
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

/* ============================
   Bloque NUEVO: Importar Excel
   ============================ */
function ImportadorTarifas() {
  const [file, setFile] = useState<File|null>(null);
  const [tipo, setTipo] = useState<'LUZ'|'GAS'|'TELEFONIA'>('LUZ');
  const [subtipo, setSubtipo] = useState('2.0TD');
  const [replace, setReplace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setMsg('Selecciona un Excel'); return; }
    setLoading(true); setMsg(null);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('tipo', tipo);
    fd.append('subtipo', subtipo);
    fd.append('replace', String(replace));

    const res = await fetch('/api/ofertas-tarifa/import', { method: 'POST', body: fd });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? `Importadas ${data.ofertas} ofertas y ${data.tramos} tramos` : (data?.error || 'Error al importar'));

    // Notificar a la tabla que recargue
    window.dispatchEvent(new CustomEvent('tarifas-importadas'));
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow text-black space-y-3">
      <h3 className="text-lg font-bold">Catálogo de Tarifas • Importar Excel</h3>
      <form onSubmit={submit} className="flex flex-col md:flex-row gap-3 items-start">
        <select value={tipo} onChange={e=>setTipo(e.target.value as any)} className="border rounded p-2">
          <option value="LUZ">Luz</option>
          <option value="GAS">Gas</option>
          <option value="TELEFONIA">Telefonía</option>
        </select>
        <input
          className="border rounded p-2"
          placeholder="Subtipo (2.0TD, 3.0TD, 6.1TD...)"
          value={subtipo}
          onChange={e=>setSubtipo(e.target.value)}
        />
        <input type="file" accept=".xlsx,.xls" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={replace} onChange={e=>setReplace(e.target.checked)} />
          Reemplazar subtipo
        </label>
        <Button disabled={loading} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
          <Upload className="w-4 h-4" /> {loading ? 'Importando…' : 'Importar'}
        </Button>
      </form>
      {msg && <div className="text-sm text-gray-700">{msg}</div>}
      <div className="text-xs text-gray-600">
        Cabeceras soportadas: <code>tipo</code>, <code>subtipo</code>, <code>compania</code>, <code>anexo</code>, <code>nombre</code>, <code>descripcion</code>, <code>precio_kwh_p1..p6</code>, <code>comision_kwh_admin_base</code>, tramos: <code>consumo_desde_kwh</code>/<code>_mensual</code>, <code>consumo_hasta_kwh</code>/<code>_mensual</code>, <code>comision_kwh_admin_tramo</code>, <code>comision_fija_admin</code>, reparto: <code>pct_cliente</code>, <code>pct_lugar</code>, <code>pct_agente</code>.
      </div>
    </div>
  );
}

/* ============================
   Bloque NUEVO: Tabla catálogo
   ============================ */
function TablaTarifas() {
  const [rows, setRows] = useState<OfertaTarifa[]>([]);
  const [tipo, setTipo] = useState<'LUZ'|'GAS'|'TELEFONIA'>('LUZ');
  const [subtipo, setSubtipo] = useState('2.0TD');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const url = `/api/ofertas-tarifa?tipo=${tipo}&subtipo=${encodeURIComponent(subtipo)}&activa=true`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    setRows(data.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('tarifas-importadas', handler);
    return () => window.removeEventListener('tarifas-importadas', handler);
  }, [tipo, subtipo]);

  const borrar = async (id: number) => {
    if (!confirm('¿Eliminar esta tarifa?')) return;
    await fetch(`/api/ofertas-tarifa?id=${id}`, { method: 'DELETE' });
    load();
  };

  const fmt = (v: any) => (v === null || v === undefined || v === '') ? '-' : String(v);

  return (
    <div className="bg-white p-4 rounded-xl shadow text-black">
      <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        <div className="flex gap-3">
          <select value={tipo} onChange={e=>setTipo(e.target.value as any)} className="border rounded p-2">
            <option value="LUZ">Luz</option>
            <option value="GAS">Gas</option>
            <option value="TELEFONIA">Telefonía</option>
          </select>
          <input className="border rounded p-2" value={subtipo} onChange={e=>setSubtipo(e.target.value)} placeholder="Subtipo (2.0TD/3.0TD/6.1TD)" />
          <Button variant="outline" onClick={load} className="flex items-center gap-2"><Download className="w-4 h-4" /> Refrescar</Button>
        </div>
        <div className="text-sm text-gray-700">{loading ? 'Cargando…' : `${rows.length} tarifas`}</div>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Compañía</th>
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Subtipo</th>
              <th className="p-2 text-right">P1</th>
              <th className="p-2 text-right">P2</th>
              <th className="p-2 text-right">P3</th>
              <th className="p-2 text-right">P4</th>
              <th className="p-2 text-right">P5</th>
              <th className="p-2 text-right">P6</th>
              <th className="p-2 text-right">Com. base €/kWh</th>
              <th className="p-2 text-right"># Tramos</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.compania}</td>
                <td className="p-2">{r.nombre}</td>
                <td className="p-2 text-center">{r.tipo}</td>
                <td className="p-2 text-center">{r.subtipo}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP1)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP2)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP3)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP4)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP5)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP6)}</td>
                <td className="p-2 text-right">{fmt(r.comisionKwhAdminBase)}</td>
                <td className="p-2 text-right">{r.tramos?.length ?? 0}</td>
                <td className="p-2 text-right">
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => borrar(r.id)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={13}>Sin datos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GestionOfertasContenido() {
  const { data: session, status } = useSession()
  const rawRole =
    (session as any)?.user?.role ??
    (session as any)?.user?.rol ?? // por si lo traes como 'rol'
    ''
  const esAdmin = String(rawRole).toUpperCase() === 'ADMIN'

  console.log('DEBUG session.user =>', (session as any)?.user);


  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    descripcionCorta: '',
    tipo: 'luz' as 'luz'|'gas'|'telefonia',
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
  <div className="p-6 space-y-6 border-4 border-red-500">
    <div className="bg-yellow-300 text-black p-3 rounded-lg font-extrabold text-center">
      DEBUG: NUEVO CATÁLOGO ACTIVO EN /ofertas
    </div>

    {/* MOSTRAR SOLO EL CATALOGO/IMPORTADOR (temporal para probar) */}
    <ImportadorTarifas />
    <TablaTarifas />
  </div>
);

}
