'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Flame, Phone, Trash2, Pencil, Upload, Download, Trash } from 'lucide-react'

function SimpleModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white text-black w-[95vw] max-w-3xl max-h-[80vh] rounded-2xl shadow-xl p-4 overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md border hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
        <div className="mt-3 overflow-auto max-h-[65vh]">{children}</div>
      </div>
    </div>
  )
}


/* =========================
   Tipados
   ========================= */
type Oferta = {
  id: number
  titulo: string
  descripcion: string
  descripcionCorta: string | null
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
  notas?: string | null
}

type OfertaTarifa = {
  id: number
  tipo: 'LUZ' | 'GAS' | 'TELEFONIA'
  subtipo: string
  compania: string
  nombre: string

  referencia?: string | null          // NUEVO
  tipoCliente?: 'RESIDENCIAL'|'PYME' | null // NUEVO

  activa: boolean
  destacada?: boolean

  precioKwhP1?: number | string | null
  precioKwhP2?: number | string | null
  precioKwhP3?: number | string | null
  precioKwhP4?: number | string | null
  precioKwhP5?: number | string | null
  precioKwhP6?: number | string | null

    // potencia
  precioPotenciaP1?: number | string | null
  precioPotenciaP2?: number | string | null
  precioPotenciaP3?: number | string | null
  precioPotenciaP4?: number | string | null
  precioPotenciaP5?: number | string | null
  precioPotenciaP6?: number | string | null

  comisionKwhAdminBase?: number | string | null
  tramos?: Tramo[]
  actualizadaEn?: string              // viene como ISO
}

/* =========================
   Helpers UI
   ========================= */
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

const rowClassByTipoCliente = (t?: 'RESIDENCIAL'|'PYME'|null) =>
  t === 'PYME' ? 'bg-orange-50' : t === 'RESIDENCIAL' ? 'bg-green-50' : '';


/* =========================
   Importador Excel (solo ADMIN)
   ========================= */
function ImportadorTarifas() {
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState<'LUZ' | 'GAS' | 'TELEFONIA'>('LUZ');
  const [subtipo, setSubtipo] = useState('2.0TD');
  const [replace, setReplace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  const normKey = (s: any) =>
    String(s || '')
      .replace(/\u00A0/g, ' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^\w %/().-]/g, '')
      .replace(/\s*\(([^)]*)\)/g, ' ($1)');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setMsg('Selecciona un Excel'); return; }

    setLoading(true);
    setMsg('Leyendo Excel…');
    setProgress({ done: 0, total: 0 });

    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });
      if (!raw.length) { setMsg('El Excel está vacío'); setLoading(false); return; }

      const rows = raw.map((r: any) => {
        const n: any = {};
        for (const [k, v] of Object.entries(r)) n[normKey(k)] = v;
        return n;
      });

      const CHUNK = 500;
      const total = Math.ceil(rows.length / CHUNK);
      setProgress({ done: 0, total });

      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const res = await fetch('/api/ofertas-tarifa/import-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo,
            subtipo,
            rows: slice,
            replace,
            firstChunk: i === 0,
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Fallo en bloque ${i / CHUNK + 1}`);
        }
        setProgress({ done: Math.min(i / CHUNK + 1, total), total });
        setMsg(`Importando… ${Math.min(i / CHUNK + 1, total)} / ${total}`);
      }

      setMsg(`✅ Importación completada (${rows.length} filas procesadas)`);
      window.dispatchEvent(new CustomEvent('tarifas-importadas'));
    } catch (err: any) {
      console.error(err);
      setMsg(`❌ ${err?.message || 'Error al importar'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow text-black space-y-3">
      <h3 className="text-lg font-bold">Catálogo de Tarifas • Importar Excel</h3>
      <form onSubmit={submit} className="flex flex-col md:flex-row gap-3 items-start">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as any)} className="border rounded p-2">
          <option value="LUZ">Luz</option>
          <option value="GAS">Gas</option>
          <option value="TELEFONIA">Telefonía</option>
        </select>
        <input
          className="border rounded p-2"
          placeholder="Subtipo (2.0TD, 3.0TD, 6.1TD...)"
          value={subtipo}
          onChange={(e) => setSubtipo(e.target.value)}
        />
        <input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          Reemplazar subtipo
        </label>
        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
          {loading ? 'Importando…' : 'Importar'}
        </Button>
      </form>

      {msg && <div className="text-sm text-gray-700">{msg}</div>}
      {progress.total > 0 && (
        <div className="text-xs text-gray-600">
          Progreso: {progress.done} / {progress.total} bloques
          <div className="h-2 bg-gray-200 rounded mt-1 overflow-hidden">
            <div className="h-2" style={{ width: `${(progress.done / progress.total) * 100}%`, backgroundColor: '#16a34a' }} />
          </div>
        </div>
      )}
      <div className="text-xs text-gray-600">
        Cabeceras soportadas: <code>compañia</code>, <code>nombre (anexo)</code>, <code>tarifa/subtipo</code>, <code>potencia</code>, <code>consumo</code>, precios <code>P1..P6</code> y <code>COMISION COMPARADOR</code>.
      </div>
    </div>
  );
}

/* =========================
   Tabla Catálogo + Publicar
   ========================= */
function TablaTarifas({ esAdmin, onPublicada }:{ esAdmin:boolean; onPublicada: ()=>void }) {
  const [rows, setRows] = useState<OfertaTarifa[]>([]);
  const [tipo, setTipo] = useState<'LUZ'|'GAS'|'TELEFONIA'>('LUZ');
  const [subtipo, setSubtipo] = useState('2.0TD');
  const [loading, setLoading] = useState(false);

  // Modal de tramos
  const [openModal, setOpenModal] = useState(false);
  const [sel, setSel] = useState<OfertaTarifa | null>(null);

  const load = async () => {
    setLoading(true);
    const url = `/api/ofertas-tarifa?tipo=${tipo}&subtipo=${encodeURIComponent(subtipo)}&activa=true`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    const items: OfertaTarifa[] = data.items || [];

    // Ordenar por compañía y luego por nombre (anexo)
    items.sort((a, b) => {
      const c = (a.compania || '').localeCompare(b.compania || '', 'es', { sensitivity: 'base' });
      if (c !== 0) return c;
      return (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' });
    });

    setRows(items);
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

  const publicarComoOferta = async (r: OfertaTarifa) => {
    const titulo = `${r.compania} · ${r.nombre}`;
    const descripcion = `Tarifa ${r.subtipo} (${r.tipo})`;
    const descripcionCorta =
      `P1 ${r.precioKwhP1 ?? '-'} | P2 ${r.precioKwhP2 ?? '-'} | P3 ${r.precioKwhP3 ?? '-'}`;

    const res = await fetch('/api/ofertas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo,
        descripcion,
        descripcionCorta,
        tipo: 'luz',
        destacada: false,
        activa: true,
        ofertaTarifaId: r.id,
      }),
    });

    if (res.ok) {
      alert('Publicada en Ofertas');
      onPublicada();
    } else {
      const data = await res.json().catch(()=>({}));
      alert('Error al publicar: ' + (data?.error || res.statusText));
    }
  };

  const fmt = (v: any) => (v === null || v === undefined || v === '') ? '-' : String(v);

  // Ordena tramos por consumo
  const tramosOrdenados = (t: Tramo[] | undefined) =>
    (t || []).slice().sort((a, b) => (a.consumoDesdeKWh ?? 0) - (b.consumoDesdeKWh ?? 0));

  // Color de fila por tipo de cliente; si no viene, inferir por nombre
  const rowClassByTipoCliente = (tipoCliente: string | null | undefined, nombre: string | undefined) => {
    const tc = (tipoCliente || '').toLowerCase();
    const n = (nombre || '').toLowerCase();
    const esPyme = /pyme|empresa|negocio/.test(tc) || (!tc && /pyme|empresa|negocio/.test(n));
    return esPyme ? 'bg-orange-50' : 'bg-green-50';
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow text-black">
      <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        <div className="flex gap-3">
          <select value={tipo} onChange={e=>setTipo(e.target.value as any)} className="border rounded p-2">
            <option value="LUZ">Luz</option>
            <option value="GAS">Gas</option>
            <option value="TELEFONIA">Telefonía</option>
          </select>
          <Input
            className="border rounded p-2"
            value={subtipo}
            onChange={e=>setSubtipo(e.target.value)}
            placeholder="Subtipo (2.0TD/3.0TD/6.1TD)"
          />
          <Button variant="outline" onClick={load} className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Refrescar
          </Button>
        </div>
        <div className="text-sm text-gray-700">{loading ? 'Cargando…' : `${rows.length} tarifas`}</div>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Ref.</th>
              <th className="p-2 text-left">Compañía</th>
              <th className="p-2 text-left">Anexo (Nombre)</th>
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
              <th className="p-2 text-left whitespace-nowrap">Últ. actualización</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-b ${rowClassByTipoCliente((r as any).tipoCliente, r.nombre)}`}>
                <td className="p-2">{(r as any).ref ?? '—'}</td>
                <td className="p-2">{r.compania}</td>
                <td className="p-2">{r.nombre}</td>
                <td className="p-2 text-center">{(r as any).tipoCliente ?? '—'}</td>
                <td className="p-2 text-center">{r.subtipo}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP1)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP2)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP3)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP4)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP5)}</td>
                <td className="p-2 text-right">{fmt(r.precioKwhP6)}</td>
                <td className="p-2 text-right">{fmt(r.comisionKwhAdminBase)}</td>
                <td className="p-2 text-right">{r.tramos?.length ?? 0}</td>
                <td className="p-2">
                  {(r as any).ultimaActualizacion
                    ? new Date((r as any).ultimaActualizacion as any).toLocaleDateString('es-ES')
                    : '—'}
                </td>
                <td className="p-2">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50"
                      onClick={() => { setSel(r); setOpenModal(true); }}
                    >
                      Ver tramos
                    </Button>
                    {esAdmin && (
                      <Button
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => publicarComoOferta(r)}
                      >
                        Publicar
                      </Button>
                    )}
                    {esAdmin && (
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => borrar(r.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-4 text-center text-gray-500" colSpan={15}>Sin datos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal con los tramos de la tarifa seleccionada */}
      <SimpleModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={sel ? `${sel.compania} · ${sel.nombre} — Tramos` : 'Tramos'}
      >
        {!sel ? null : (
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              <div><strong>Tipo/Subtipo:</strong> {sel.tipo} / {sel.subtipo}</div>
              <div><strong>Precios potencia (€/kW·año):</strong> P1 {fmt((sel as any).precioPotenciaP1)} · P2 {fmt((sel as any).precioPotenciaP2)} · P3 {fmt((sel as any).precioPotenciaP3)} · P4 {fmt((sel as any).precioPotenciaP4)} · P5 {fmt((sel as any).precioPotenciaP5)} · P6 {fmt((sel as any).precioPotenciaP6)}</div>
              <div><strong>Precios energía (€/kWh):</strong> P1 {fmt(sel.precioKwhP1)} · P2 {fmt(sel.precioKwhP2)} · P3 {fmt(sel.precioKwhP3)} · P4 {fmt(sel.precioKwhP4)} · P5 {fmt(sel.precioKwhP5)} · P6 {fmt(sel.precioKwhP6)}</div>
            </div>
            <div className="overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-right">Consumo desde (kWh/año)</th>
                    <th className="p-2 text-right">Consumo hasta (kWh/año)</th>
                    <th className="p-2 text-right">Comisión €/kWh</th>
                    <th className="p-2 text-right">Comisión fija €</th>
                    <th className="p-2 text-left">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {tramosOrdenados(sel.tramos).map(t => (
                    <tr key={t.id} className="border-b">
                      <td className="p-2 text-right">{t.consumoDesdeKWh}</td>
                      <td className="p-2 text-right">{t.consumoHastaKWh ?? '—'}</td>
                      <td className="p-2 text-right">{fmt(t.comisionKwhAdmin)}</td>
                      <td className="p-2 text-right">{fmt(t.comisionFijaAdmin)}</td>
                      <td className="p-2">{t.notas || '—'}</td>
                    </tr>
                  ))}
                  {(!sel.tramos || sel.tramos.length === 0) && (
                    <tr><td className="p-3 text-center text-gray-500" colSpan={5}>Sin tramos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SimpleModal>
    </div>
  );
}



/* =========================
   Página principal con pestañas
   ========================= */
export default function GestionOfertasContenido() {
  const { data: session, status } = useSession()
  const rawRole =
    (session as any)?.user?.role ??
    (session as any)?.user?.rol ??
    ''
  const esAdmin = String(rawRole).toUpperCase() === 'ADMIN'

  // Tabs
  const [tab, setTab] = useState<'marketing'|'catalogo-luz'>('marketing')

  // Marketing (ofertas manuales)
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    descripcionCorta: '',
    tipo: 'luz' as 'luz'|'gas'|'telefonia',
    destacada: false,
    activa: true,
  })

  // Catálogo de Luz para mostrar resumen en Marketing (sección LUZ)
  const [tarifasLuz, setTarifasLuz] = useState<OfertaTarifa[]>([])

  const cargarOfertas = async () => {
    const res = await fetch('/api/ofertas?activa=true', { cache: 'no-store' })
    const data = await res.json()
    setOfertas(data)
  }
  const cargarTarifasLuz = async () => {
    const res = await fetch('/api/ofertas-tarifa?tipo=LUZ&activa=true', { cache: 'no-store' })
    const data = await res.json()
    setTarifasLuz(data.items || [])
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
      cargarTarifasLuz()
    }
  }, [status])

  if (status === 'loading') return <div className="p-6 text-white">Cargando...</div>
  if (!session) return <div className="p-6 text-white">Acceso restringido. Por favor inicia sesión.</div>

  // Agrupar ofertas por tipo (marketing)
  const ofertasLuz = useMemo(() => ofertas.filter(o => o.tipo === 'luz'), [ofertas])
  const ofertasGas = useMemo(() => ofertas.filter(o => o.tipo === 'gas'), [ofertas])
  const ofertasTel = useMemo(() => ofertas.filter(o => o.tipo === 'telefonia'), [ofertas])

  // Tarjetas derivadas del Catálogo de Luz (para Marketing/Luz)
  const tarjetasCatalogoLuz = useMemo(() => {
    const fmt = (v: any) => (v === null || v === undefined || v === '') ? '-' : String(v)
    return (tarifasLuz || []).map(t => ({
      id: t.id,
      titulo: `${t.compania} — ${t.nombre}`,
      descripcionCorta: `P1 ${fmt(t.precioKwhP1)} · P2 ${fmt(t.precioKwhP2)} · P3 ${fmt(t.precioKwhP3)}`,
      destacada: !!t.destacada,
    }))
  }, [tarifasLuz])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Gestión de Ofertas</h1>

      {/* Pestañas */}
      <div className="flex gap-2">
        <button
          onClick={()=>setTab('marketing')}
          className={`px-3 py-1 rounded ${tab==='marketing'?'bg-yellow-400 text-black':'bg-white text-black border'}`}
        >
          Ofertas (marketing)
        </button>
        <button
          onClick={()=>setTab('catalogo-luz')}
          className={`px-3 py-1 rounded ${tab==='catalogo-luz'?'bg-yellow-400 text-black':'bg-white text-black border'}`}
        >
          Catálogo Luz
        </button>
      </div>

      {/* ---- Pestaña: Ofertas marketing ---- */}
      {tab==='marketing' && (
        <>
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

          {/* Sección LUZ (marketing + catálogo) */}
          <Section title="LUZ" tipo="luz">
            {/* Ofertas marketing */}
            {ofertasLuz.map((oferta) => (
              <TarjetaMarketing
                key={`O-${oferta.id}`}
                oferta={oferta}
                esAdmin={esAdmin}
                onEliminar={()=>eliminarOferta(oferta.id)}
              />
            ))}
            {/* Tarjetas provenientes del catálogo */}
            {tarjetasCatalogoLuz.map((t) => (
              <Card key={`T-${t.id}`} className={`${fondoPorTipo['luz']} shadow-md rounded-2xl text-black border border-green-200`}>
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div>
                    <div className={`text-xs px-2 py-1 inline-block rounded-full font-semibold mb-2 ${colorEtiqueta('luz')}`}>
                      {obtenerIcono('luz')} CATÁLOGO · LUZ
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t.titulo}</h3>
                    <p className="text-sm text-gray-800">{t.descripcionCorta}</p>
                    {t.destacada && <div className="mt-1 text-orange-600 font-bold text-sm">⭐ Destacada</div>}
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => alert('Más información disponible próximamente')}
                      className="bg-black text-white hover:bg-gray-800 text-sm px-3 py-1"
                    >
                      Ir a la oferta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </Section>

          {/* Sección GAS */}
          <Section title="GAS" tipo="gas">
            {ofertasGas.map((oferta) => (
              <TarjetaMarketing
                key={`O-${oferta.id}`}
                oferta={oferta}
                esAdmin={esAdmin}
                onEliminar={()=>eliminarOferta(oferta.id)}
              />
            ))}
          </Section>

          {/* Sección TELEFONÍA */}
          <Section title="TELEFONÍA" tipo="telefonia">
            {ofertasTel.map((oferta) => (
              <TarjetaMarketing
                key={`O-${oferta.id}`}
                oferta={oferta}
                esAdmin={esAdmin}
                onEliminar={()=>eliminarOferta(oferta.id)}
              />
            ))}
          </Section>
        </>
      )}

      {/* ---- Pestaña: Catálogo Luz ---- */}
      {tab==='catalogo-luz' && (
        <div className="space-y-4">
          {esAdmin && <ImportadorTarifas />}
          <TablaTarifas
            esAdmin={esAdmin}
            onPublicada={() => {
              // Al publicar desde catálogo recargamos marketing y también el catálogo de luz (por si cambió)
              setTab('marketing')
              cargarOfertas()
              cargarTarifasLuz()
            }}
          />
        </div>
      )}
    </div>
  )
}

/* ============ Componentes de apoyo ============ */

function Section({ title, tipo, children }:{
  title: string
  tipo: 'luz'|'gas'|'telefonia'
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-extrabold text-white">{title}</h2>
      <div className={`rounded-2xl p-4 ${fondoPorTipo[tipo]}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {children}
        </div>
      </div>
    </div>
  )
}

function TarjetaMarketing({ oferta, esAdmin, onEliminar }:{
  oferta: Oferta
  esAdmin: boolean
  onEliminar: ()=>void
}) {
  const tipo = oferta.tipo.toLowerCase()
  return (
    <Card className={`${fondoPorTipo[tipo]} shadow-md rounded-2xl text-black`}>
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
                onClick={onEliminar}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
