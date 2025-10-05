'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';

// --------- Helpers ----------
const fmtPct = (v: any) => (v == null ? '—' : `${(Number(v) * 100).toFixed(1)}%`);
const toNumberOr = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

type Fondo = { id: number; nombre: string; url: string; activo?: boolean };
type Lugar = any;

export default function RegistrarLugar() {
  const router = useRouter();
  const { data: session } = useSession();
  const esAdmin = session?.user?.role === 'ADMIN';

  const [agentes, setAgentes] = useState<any[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [fondos, setFondos] = useState<Fondo[]>([]);
  const [fondoSeleccionado, setFondoSeleccionado] = useState<string>('');

  // Listado/búsqueda
  const [busqueda, setBusqueda] = useState('');

  // Alta
  const [nuevoQR, setNuevoQR] = useState('');
  const [nuevo, setNuevo] = useState({
    nombre: '',
    direccion: '',
    qrCode: '',
    agenteId: '',
    pctCliente: '', // aceptamos "15" o "0.15" (la API lo normaliza)
    pctLugar: '',
    especial: false,
    especialColor: '#FF7A3B',
    especialMensaje: '',
    aportacionAcumulada: '0',
    logoFile: null as File | null,
    especialLogoUrl: '', // (se rellenará si subes logo)
  });

  // Edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [edit, setEdit] = useState<Lugar | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);

  // Carga inicial
  useEffect(() => {
    (async () => {
      const [rAg, rLg, rFd] = await Promise.all([
        fetch('/api/agentes'),
        fetch('/api/lugares'),
        fetch('/api/fondos'),
      ]);
      const [dAg, dLg, dFd] = await Promise.all([rAg.json(), rLg.json(), rFd.json()]);
      setAgentes(dAg);
      setLugares(dLg);
      setFondos(dFd);
      const activo = dFd.find((f: Fondo) => f.activo);
      if (activo) setFondoSeleccionado(activo.url);
    })();
  }, []);

  // ---- Listado filtrado (por cualquier campo visible) ----
  const lugaresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lugares;
    return lugares.filter((l: any) => {
      const estado = l.especial ? 'especial' : 'normal';
      const txt = [
        `#${l.id}`,
        l.nombre ?? '',
        l.direccion ?? '',
        l.agente?.nombre ?? '',
        fmtPct(l.pctCliente),
        fmtPct(l.pctLugar),
        estado,
      ].join(' ');
      return txt.toLowerCase().includes(q);
    });
  }, [lugares, busqueda]);

  // ---- Subida de ficheros (logo) ----
  async function subirLogo(file: File): Promise<string | null> {
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'logos-lugares');

      const r = await fetch('/api/upload', { method: 'POST', body: form });
      if (!r.ok) return null;
      const data = await r.json();
      return data.url || null;
    } catch {
      return null;
    }
  }

  // ---- Alta (nuevo) ----
  const generarQR_nuevo = () => {
    const id = uuidv4();
    setNuevo((s) => ({ ...s, qrCode: id }));
    setNuevoQR(id);
  };

  const registrarLugar = async (e: React.FormEvent) => {
    e.preventDefault();

    let especialLogoUrl = nuevo.especialLogoUrl;
    if (nuevo.especial && nuevo.logoFile) {
      const up = await subirLogo(nuevo.logoFile);
      if (up) especialLogoUrl = up;
    }

    const body = {
      nombre: nuevo.nombre.trim(),
      direccion: nuevo.direccion.trim(),
      qrCode: nuevo.qrCode.trim(),
      agenteId: nuevo.agenteId,
      pctCliente: nuevo.pctCliente,
      pctLugar: nuevo.pctLugar,

      especial: nuevo.especial,
      especialLogoUrl,
      especialColor: nuevo.especialColor,
      especialMensaje: nuevo.especialMensaje,
      aportacionAcumulada: toNumberOr(nuevo.aportacionAcumulada, 0),
    };

    const r = await fetch('/api/lugares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) {
      alert(d?.error || 'Error al crear lugar');
      return;
    }
    setLugares((arr) => [d, ...arr]);

    // reset
    setNuevo({
      nombre: '',
      direccion: '',
      qrCode: '',
      agenteId: '',
      pctCliente: '',
      pctLugar: '',
      especial: false,
      especialColor: '#FF7A3B',
      especialMensaje: '',
      aportacionAcumulada: '0',
      logoFile: null,
      especialLogoUrl: '',
    });
    setNuevoQR('');
  };

  // ---- Edición (modal) ----
  const abrirEdicion = (l: Lugar) => {
    setEditLogoFile(null);
    setEdit({
      ...l,
      especial: !!l.especial,
      especialColor: l.especialColor ?? '#FF7A3B',
      especialMensaje: l.especialMensaje ?? '',
      aportacionAcumulada: l.aportacionAcumulada ?? 0,
    });
    setModalAbierto(true);
  };

  const generarQR_edit = () => {
    if (!edit) return;
    const id = uuidv4();
    setEdit({ ...edit, qrCode: id });
  };

  const guardarEdicion = async () => {
    if (!edit) return;

    let especialLogoUrl = edit.especialLogoUrl ?? '';
    if (edit.especial && editLogoFile) {
      const up = await subirLogo(editLogoFile);
      if (up) especialLogoUrl = up;
    }

    const r = await fetch(`/api/lugares/${edit.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: edit.nombre,
        direccion: edit.direccion,
        qrCode: edit.qrCode,
        agenteId: edit.agenteId,
        pctCliente: edit.pctCliente,
        pctLugar: edit.pctLugar,

        especial: !!edit.especial,
        especialLogoUrl,
        especialColor: edit.especialColor,
        especialMensaje: edit.especialMensaje,
        aportacionAcumulada: toNumberOr(edit.aportacionAcumulada, 0),
      }),
    });
    const d = await r.json();
    if (!r.ok) {
      alert(d?.error || 'Error al guardar');
      return;
    }
    setLugares((arr) => arr.map((x) => (x.id === d.id ? d : x)));
    setModalAbierto(false);
  };

  const eliminarLugar = async (id: number) => {
    if (!confirm('¿Eliminar lugar definitivamente?')) return;
    await fetch(`/api/lugares/${id}`, { method: 'DELETE' });
    setLugares((arr) => arr.filter((x) => x.id !== id));
  };

  const seleccionarFondo = async (id: number, url: string) => {
    await fetch('/api/fondos/seleccionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setFondoSeleccionado(url);
  };

  return (
    <div className="p-8 bg-[#B3E58C] min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
            alt="Impulso Energético"
            width={160}
            height={48}
            priority
          />
          <span className="hidden md:inline text-[#1F1F1F]">CRM · Lugares</span>
        </div>
        <Button onClick={() => router.push('/dashboard')} className="bg-[#F0C300] text-black hover:bg-yellow-400">
          🏠 Dashboard
        </Button>
      </div>

      {/* ALTA DE LUGAR */}
      <h1 className="text-3xl font-bold text-[#1F1F1F] mb-4">Nuevo lugar</h1>

      <form onSubmit={registrarLugar} className="bg-white rounded-2xl shadow p-6 mb-10 text-[#1F1F1F]">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm font-semibold">Nombre</label>
            <Input
              value={nuevo.nombre}
              onChange={(e) => setNuevo((s) => ({ ...s, nombre: e.target.value }))}
              placeholder="Nombre del lugar"
              className="mt-1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Dirección</label>
            <Input
              value={nuevo.direccion}
              onChange={(e) => setNuevo((s) => ({ ...s, direccion: e.target.value }))}
              placeholder="Dirección"
              className="mt-1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold">% Cliente (ej. 15 o 0.15)</label>
            <Input
              inputMode="decimal"
              value={nuevo.pctCliente}
              onChange={(e) => setNuevo((s) => ({ ...s, pctCliente: e.target.value }))}
              placeholder="15  ó  0.15"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">% Lugar (ej. 10 o 0.10)</label>
            <Input
              inputMode="decimal"
              value={nuevo.pctLugar}
              onChange={(e) => setNuevo((s) => ({ ...s, pctLugar: e.target.value }))}
              placeholder="10  ó  0.10"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Código QR</label>
            <div className="flex gap-3 items-center mt-1">
              <Input
                value={nuevo.qrCode}
                onChange={(e) => setNuevo((s) => ({ ...s, qrCode: e.target.value }))}
                placeholder="Se genera automáticamente si lo prefieres"
              />
              <Button type="button" onClick={generarQR_nuevo} className="bg-blue-600 text-white">
                Generar QR
              </Button>
              {nuevoQR && (
                <QRCode
                  value={`https://impulsoenergetico.es/registro?agenteId=${nuevo.agenteId}&lugarId=__ID__`}
                  size={44}
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Agente</label>
            <select
              className="mt-1 w-full border rounded p-2 bg-white"
              value={nuevo.agenteId}
              onChange={(e) => setNuevo((s) => ({ ...s, agenteId: e.target.value }))}
              required
            >
              <option value="">Selecciona un agente…</option>
              {agentes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LUGAR ESPECIAL */}
        <fieldset className="mt-6 border rounded-xl p-4 bg-[#F6FFEC]">
          <legend className="px-2 text-sm font-bold text-emerald-700">
            Lugar especial (club, asociación, evento…)
          </legend>

          <div className="flex items-center gap-3 mb-3">
            <input
              id="nuevo-especial"
              type="checkbox"
              checked={nuevo.especial}
              onChange={(e) => setNuevo((s) => ({ ...s, especial: e.target.checked }))}
            />
            <label htmlFor="nuevo-especial" className="text-sm">
              Marcar como lugar especial
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm font-semibold">Logo del club / asociación</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNuevo((s) => ({ ...s, logoFile: e.target.files?.[0] || null }))}
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Color de acento</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={nuevo.especialColor}
                  onChange={(e) => setNuevo((s) => ({ ...s, especialColor: e.target.value }))}
                  className="h-10 w-16 rounded"
                />
                <Input
                  value={nuevo.especialColor}
                  onChange={(e) => setNuevo((s) => ({ ...s, especialColor: e.target.value }))}
                />
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="text-sm font-semibold">Aportación acumulada (€)</label>
              <Input
                inputMode="numeric"
                value={nuevo.aportacionAcumulada}
                onChange={(e) => setNuevo((s) => ({ ...s, aportacionAcumulada: e.target.value }))}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-sm font-semibold">Mensaje / gancho</label>
              <Input
                value={nuevo.especialMensaje}
                onChange={(e) => setNuevo((s) => ({ ...s, especialMensaje: e.target.value }))}
                placeholder='Ej.: "AYUDA A TU CLUB"'
                className="mt-1"
              />
            </div>
          </div>
        </fieldset>

        <div className="mt-6">
          <Button type="submit" className="bg-[#68B84B] hover:bg-green-700 text-white w-full md:w-auto">
            Registrar lugar
          </Button>
        </div>
      </form>

      {/* LISTADO */}
      <div className="bg-[#E5FFD5] p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-3 text-[#1F1F1F]">Lugares Registrados</h2>
        <Input
          placeholder="Buscar por ID, nombre, dirección, agente, % o estado (especial/normal)…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 bg-white text-black"
        />

        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F0C300] text-black">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Nombre</th>
                <th className="p-2">Dirección</th>
                <th className="p-2">Agente</th>
                <th className="p-2">% Cliente</th>
                <th className="p-2">% Lugar</th>
                <th className="p-2">Estado</th> {/* NUEVO */}
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-[#1F1F1F]">
              {lugaresFiltrados.map((l: any) => (
                <tr key={l.id} className="border-b hover:bg-[#f9f9f9]">
                  <td className="p-2 font-semibold">#{l.id}</td>
                  <td className="p-2">{l.nombre}</td>
                  <td className="p-2">{l.direccion}</td>
                  <td className="p-2">{l.agente?.nombre || '-'}</td>
                  <td className="p-2">{fmtPct(l.pctCliente)}</td>
                  <td className="p-2">{fmtPct(l.pctLugar)}</td>

                  {/* ESTADO (badge) */}
                  <td className="p-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${l.especial ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-700'}`}
                      title={l.especial ? 'Lugar especial' : 'Lugar normal'}
                    >
                      {l.especial ? 'Especial' : 'Normal'}
                    </span>
                  </td>

                  <td className="p-2 flex flex-wrap gap-2">
                    <Button className="bg-blue-600 text-white" onClick={() => abrirEdicion(l)}>
                      Editar
                    </Button>
                    <Button
                      className="bg-yellow-500 text-black"
                      onClick={() => router.push(`/lugares/${l.id}/detalle`)}
                    >
                      Ver
                    </Button>
                    <Button
                      className="bg-orange-500 text-white"
                      onClick={() => router.push(`/lugares/cartel/${l.id}`)}
                    >
                      Generar cartel
                    </Button>
                    <Button
                      className="bg-emerald-600 text-white"
                      onClick={() =>
                        window.open(`/registro?agenteId=${l.agenteId}&lugarId=${l.id}`, '_blank')
                      }
                    >
                      Probar landing
                    </Button>
                    <Button className="bg-red-600 text-white" onClick={() => eliminarLugar(l.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fondo actual (solo admin) */}
        <div className="mt-10 bg-[#D4FFD0] p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-[#1F1F1F] mb-3">🎨 Fondo actual del cartel</h3>
          {esAdmin ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fondos.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => seleccionarFondo(f.id, f.url)}
                    className={`cursor-pointer border-4 rounded-xl overflow-hidden transition-all hover:scale-105 ${
                      f.url === fondoSeleccionado ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={f.url}
                      alt={f.nombre}
                      width={400}
                      height={200}
                      className="w-full h-40 object-cover"
                    />
                    <div className="bg-white py-1 text-center font-medium">{f.nombre}</div>
                  </div>
                ))}
              </div>
              {fondoSeleccionado && (
                <div className="mt-4">
                  <p className="font-semibold">Vista previa del fondo activo:</p>
                  <Image
                    src={fondoSeleccionado}
                    alt="Fondo seleccionado"
                    width={700}
                    height={460}
                    className="rounded-lg mt-2 border"
                  />
                </div>
              )}
            </>
          ) : (
            fondoSeleccionado && (
              <div className="text-center">
                <Image
                  src={fondoSeleccionado}
                  alt="Fondo"
                  width={700}
                  height={460}
                  className="rounded-lg border mx-auto"
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* MODAL EDICIÓN */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar lugar</DialogTitle>
          </DialogHeader>

          {!!edit && (
            <div className="space-y-5 text-[#1F1F1F]">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Nombre</label>
                  <Input
                    value={edit.nombre}
                    onChange={(e) => setEdit({ ...edit, nombre: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Dirección</label>
                  <Input
                    value={edit.direccion}
                    onChange={(e) => setEdit({ ...edit, direccion: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">% Cliente (ej. 15 o 0.15)</label>
                  <Input
                    inputMode="decimal"
                    value={edit.pctCliente ?? ''}
                    onChange={(e) => setEdit({ ...edit, pctCliente: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">% Lugar (ej. 10 o 0.10)</label>
                  <Input
                    inputMode="decimal"
                    value={edit.pctLugar ?? ''}
                    onChange={(e) => setEdit({ ...edit, pctLugar: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">Código QR</label>
                  <div className="flex items-center gap-3 mt-1">
                    <Input
                      value={edit.qrCode ?? ''}
                      onChange={(e) => setEdit({ ...edit, qrCode: e.target.value })}
                    />
                    <Button type="button" onClick={generarQR_edit} className="bg-blue-600 text-white">
                      Generar QR
                    </Button>
                    {edit.qrCode && (
                      <QRCode
                        value={`https://impulsoenergetico.es/registro?agenteId=${edit.agenteId}&lugarId=${edit.id}`}
                        size={44}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Agente</label>
                  <select
                    className="mt-1 w-full border rounded p-2 bg-white"
                    value={edit.agenteId}
                    onChange={(e) => setEdit({ ...edit, agenteId: Number(e.target.value) })}
                  >
                    <option value="">Selecciona un agente…</option>
                    {agentes.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ESPECIAL */}
              <fieldset className="border rounded-xl p-4 bg-[#F6FFEC]">
                <legend className="px-2 text-sm font-bold text-emerald-700">Lugar especial</legend>

                <div className="flex items-center gap-3 mb-3">
                  <input
                    id="edit-especial"
                    type="checkbox"
                    checked={!!edit.especial}
                    onChange={(e) => setEdit({ ...edit, especial: e.target.checked })}
                  />
                  <label htmlFor="edit-especial" className="text-sm">
                    Marcar como especial
                  </label>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-sm font-semibold">Logo (subir para actualizar)</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditLogoFile(e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                      {edit.especialLogoUrl && (
                        <Image
                          src={edit.especialLogoUrl}
                          alt="logo"
                          width={48}
                          height={48}
                          className="rounded border"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold">Color de acento</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="color"
                        value={edit.especialColor ?? '#FF7A3B'}
                        onChange={(e) => setEdit({ ...edit, especialColor: e.target.value })}
                        className="h-10 w-16 rounded"
                      />
                      <Input
                        value={edit.especialColor ?? ''}
                        onChange={(e) => setEdit({ ...edit, especialColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold">Aportación acumulada (€)</label>
                    <Input
                      inputMode="numeric"
                      value={String(edit.aportacionAcumulada ?? 0)}
                      onChange={(e) => setEdit({ ...edit, aportacionAcumulada: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-sm font-semibold">Mensaje / gancho</label>
                    <Input
                      value={edit.especialMensaje ?? ''}
                      onChange={(e) => setEdit({ ...edit, especialMensaje: e.target.value })}
                      placeholder='Ej.: "AYUDA A TU CLUB"'
                      className="mt-1"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="flex justify-end">
                <Button onClick={guardarEdicion} className="bg-[#68B84B] text-white hover:bg-green-700">
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
