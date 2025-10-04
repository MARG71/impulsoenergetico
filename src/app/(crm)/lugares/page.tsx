'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

// ===== Utils
type Fondo = { id: number; nombre: string; url: string; activo?: boolean };

const fmtPct = (v: any) => (v == null ? '—' : `${(Number(v) * 100).toFixed(1)}%`);
const pctToField = (v: any) => (v == null ? '' : String(v).trim());

// ===== Cloudinary (usa los mismos datos que “Fondos”)
const CLOUD_NAME = 'dhkzxihjg';
const UPLOAD_PRESET = 'impulso_carteles'; // si tienes un preset propio para logos, ponlo aquí

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  const json = await res.json();
  if (!res.ok || !json.secure_url) throw new Error('Fallo subiendo imagen');
  return json.secure_url as string;
}

// ===== Page
export default function RegistrarLugar() {
  const router = useRouter();
  const { data: session } = useSession();
  const esAdmin = session?.user?.role === 'ADMIN';

  const [agentes, setAgentes] = useState<any[]>([]);
  const [lugares, setLugares] = useState<any[]>([]);
  const [fondos, setFondos] = useState<Fondo[]>([]);
  const [fondoSeleccionado, setFondoSeleccionado] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');

  // Alta
  const [codigoQR, setCodigoQR] = useState('');
  const [subiendoLogoNew, setSubiendoLogoNew] = useState(false);
  const [nuevoLugar, setNuevoLugar] = useState({
    nombre: '',
    direccion: '',
    qrCode: '',
    agenteId: '',
    pctCliente: '',
    pctLugar: '',

    // Especial
    especial: false,
    especialLogoUrl: '',
    especialColor: '',
    especialMensaje: '',
    aportacionAcumulada: '', // euros (string para editar cómodo)
  });

  // Modal edición
  const [mostrarModal, setMostrarModal] = useState(false);
  const [lugarEditando, setLugarEditando] = useState<any | null>(null);
  const [subiendoLogoEdit, setSubiendoLogoEdit] = useState(false);

  useEffect(() => {
    (async () => {
      const [resAgentes, resLugares, resFondos] = await Promise.all([
        fetch('/api/agentes'),
        fetch('/api/lugares'),
        fetch('/api/fondos'),
      ]);
      const [dataAgentes, dataLugares, dataFondos] = await Promise.all([
        resAgentes.json(),
        resLugares.json(),
        resFondos.json(),
      ]);
      setAgentes(dataAgentes);
      setLugares(dataLugares);
      setFondos(dataFondos);

      const fondoActivo = dataFondos.find((f: Fondo) => f.activo);
      if (fondoActivo) setFondoSeleccionado(fondoActivo.url);
    })();
  }, []);

  // ==== Alta ====
  const generarQR = () => {
    const nuevo = uuidv4();
    setCodigoQR(nuevo);
    setNuevoLugar((s) => ({ ...s, qrCode: nuevo }));
  };

  const handleUploadLogoNew = async (f?: File) => {
    if (!f) return;
    try {
      setSubiendoLogoNew(true);
      const url = await uploadToCloudinary(f);
      setNuevoLugar((s) => ({ ...s, especialLogoUrl: url }));
    } catch (e) {
      alert('No se pudo subir el logo');
    } finally {
      setSubiendoLogoNew(false);
    }
  };

  const handleRegistrarLugar = async (e: any) => {
    e.preventDefault();

    // 1) Crea el lugar base (la API actual ya lo hace)
    const res = await fetch('/api/lugares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevoLugar.nombre,
        direccion: nuevoLugar.direccion,
        qrCode: nuevoLugar.qrCode,
        agenteId: nuevoLugar.agenteId,
        pctCliente: nuevoLugar.pctCliente,
        pctLugar: nuevoLugar.pctLugar,
      }),
    });
    const creado = await res.json();
    if (!res.ok) {
      alert(creado?.error ?? 'Error creando lugar');
      return;
    }

    // 2) Si hay datos especiales, los guardamos con PUT
    if (
      nuevoLugar.especial ||
      nuevoLugar.especialLogoUrl ||
      nuevoLugar.especialColor ||
      nuevoLugar.especialMensaje ||
      nuevoLugar.aportacionAcumulada
    ) {
      await fetch(`/api/lugares/${creado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especial: nuevoLugar.especial,
          especialLogoUrl: nuevoLugar.especialLogoUrl,
          especialColor: nuevoLugar.especialColor,
          especialMensaje: nuevoLugar.especialMensaje,
          aportacionAcumulada: nuevoLugar.aportacionAcumulada,
        }),
      });
    }

    // 3) Refrescamos lista y limpiamos
    const lista = await (await fetch('/api/lugares')).json();
    setLugares(lista);

    setNuevoLugar({
      nombre: '',
      direccion: '',
      qrCode: '',
      agenteId: '',
      pctCliente: '',
      pctLugar: '',
      especial: false,
      especialLogoUrl: '',
      especialColor: '',
      especialMensaje: '',
      aportacionAcumulada: '',
    });
    setCodigoQR('');
  };

  // ==== Lista / acciones ====
  const lugaresFiltrados = lugares.filter((lugar) => {
    const texto = `${lugar.id} ${lugar.nombre} ${lugar.direccion} ${lugar.qrCode} ${lugar.agente?.nombre} ${fmtPct(
      lugar.pctCliente,
    )} ${fmtPct(lugar.pctLugar)}`;
    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar este lugar?')) return;
    await fetch(`/api/lugares/${id}`, { method: 'DELETE' });
    setLugares((arr) => arr.filter((l) => l.id !== id));
  };

  const abrirEdicion = (lugar: any) => {
    setLugarEditando({
      ...lugar,
      pctCliente: pctToField(lugar.pctCliente),
      pctLugar: pctToField(lugar.pctLugar),
      especial: !!lugar.especial,
      especialLogoUrl: lugar.especialLogoUrl ?? '',
      especialColor: lugar.especialColor ?? '',
      especialMensaje: lugar.especialMensaje ?? '',
      aportacionAcumulada: lugar.aportacionAcumulada != null ? String(lugar.aportacionAcumulada) : '',
    });
    setMostrarModal(true);
  };

  // ==== Edición ====
  const generarQRModal = () => {
    const nuevo = uuidv4();
    setLugarEditando((s: any) => (s ? { ...s, qrCode: nuevo } : s));
  };

  const handleUploadLogoEdit = async (f?: File) => {
    if (!f || !lugarEditando) return;
    try {
      setSubiendoLogoEdit(true);
      const url = await uploadToCloudinary(f);
      setLugarEditando({ ...lugarEditando, especialLogoUrl: url });
    } catch {
      alert('No se pudo subir el logo');
    } finally {
      setSubiendoLogoEdit(false);
    }
  };

  const handleGuardarEdicion = async () => {
    if (!lugarEditando) return;
    const res = await fetch(`/api/lugares/${lugarEditando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: lugarEditando.nombre,
        direccion: lugarEditando.direccion,
        qrCode: lugarEditando.qrCode,
        agenteId: lugarEditando.agenteId,
        pctCliente: lugarEditando.pctCliente,
        pctLugar: lugarEditando.pctLugar,

        especial: lugarEditando.especial,
        especialLogoUrl: lugarEditando.especialLogoUrl,
        especialColor: lugarEditando.especialColor,
        especialMensaje: lugarEditando.especialMensaje,
        aportacionAcumulada: lugarEditando.aportacionAcumulada,
      }),
    });
    const actualizado = await res.json();
    if (!res.ok) {
      alert(actualizado?.error ?? 'Error al guardar');
      return;
    }
    setLugares((arr) => arr.map((l) => (l.id === actualizado.id ? actualizado : l)));
    setLugarEditando(null);
    setMostrarModal(false);
  };

  const handleSeleccionarFondo = async (id: number, url: string) => {
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
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-[#F0C300] text-black hover:bg-yellow-400">
            🏠 Dashboard
          </Button>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-[#1F1F1F] mb-6">Registrar Lugar</h1>

      {/* ===== Alta lugar ===== */}
      <form onSubmit={handleRegistrarLugar} className="bg-[#F6FFEC] p-6 rounded-xl shadow-md space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">Nombre del lugar</label>
            <Input
              placeholder="Ej.: Club Talavera la Nueva"
              value={nuevoLugar.nombre}
              onChange={(e) => setNuevoLugar({ ...nuevoLugar, nombre: e.target.value })}
              className="bg-white text-black placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">Dirección</label>
            <Input
              placeholder="Ej.: Talavera la Nueva - Toledo"
              value={nuevoLugar.direccion}
              onChange={(e) => setNuevoLugar({ ...nuevoLugar, direccion: e.target.value })}
              className="bg-white text-black placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">% Cliente (15 o 0.15)</label>
            <Input
              value={nuevoLugar.pctCliente}
              onChange={(e) => setNuevoLugar({ ...nuevoLugar, pctCliente: e.target.value })}
              className="bg-white text-black placeholder:text-gray-500"
              placeholder="15 o 0.15"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">% Lugar (10 o 0.10)</label>
            <Input
              value={nuevoLugar.pctLugar}
              onChange={(e) => setNuevoLugar({ ...nuevoLugar, pctLugar: e.target.value })}
              className="bg-white text-black placeholder:text-gray-500"
              placeholder="10 o 0.10"
            />
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">Código QR</label>
            <Input
              value={nuevoLugar.qrCode}
              onChange={(e) => setNuevoLugar({ ...nuevoLugar, qrCode: e.target.value })}
              className="bg-white text-black placeholder:text-gray-500"
              placeholder="Se generará automáticamente"
            />
          </div>
          <Button type="button" onClick={generarQR} className="bg-blue-600 hover:bg-blue-700 text-white">
            Generar QR
          </Button>
          {codigoQR && <QRCode value={`https://impulsoenergetico.es/comparador?qr=${codigoQR}`} size={64} />}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">Agente</label>
          <select
            className="w-full border px-4 py-2 rounded bg-white text-black"
            value={nuevoLugar.agenteId}
            onChange={(e) => setNuevoLugar({ ...nuevoLugar, agenteId: e.target.value })}
          >
            <option value="">Selecciona un agente</option>
            {agentes.map((agente) => (
              <option key={agente.id} value={agente.id}>
                {agente.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* ===== Especial (alta) ===== */}
        <div className="rounded-xl border border-emerald-300 bg-white p-4">
          <div className="flex items-center gap-3">
            <input
              id="chk-especial-new"
              type="checkbox"
              checked={nuevoLugar.especial}
              onChange={(e) => setNuevoLugar({ ...nuevoLugar, especial: e.target.checked })}
            />
            <label htmlFor="chk-especial-new" className="font-semibold text-emerald-800">
              Lugar especial (club, asociación, evento…)
            </label>
          </div>

          {nuevoLugar.especial && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Logo (subir imagen)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadLogoNew(e.target.files?.[0] || undefined)}
                    className="text-sm"
                  />
                  {subiendoLogoNew && <span className="text-sm text-gray-600">Subiendo…</span>}
                  {nuevoLugar.especialLogoUrl && (
                    <Button
                      type="button"
                      className="bg-gray-200 text-black"
                      onClick={() => setNuevoLugar((s) => ({ ...s, especialLogoUrl: '' }))}
                    >
                      Quitar
                    </Button>
                  )}
                </div>
                {nuevoLugar.especialLogoUrl && (
                  <div className="mt-2">
                    <Image
                      src={nuevoLugar.especialLogoUrl}
                      alt="Logo especial"
                      width={120}
                      height={120}
                      className="rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Color destacado (hex)</label>
                <Input
                  placeholder="#FF7A3B"
                  value={nuevoLugar.especialColor}
                  onChange={(e) => setNuevoLugar({ ...nuevoLugar, especialColor: e.target.value })}
                  className="bg-white text-black placeholder:text-gray-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Mensaje promocional</label>
                <Input
                  placeholder='Ej.: "AYUDA A TU CLUB"'
                  value={nuevoLugar.especialMensaje}
                  onChange={(e) => setNuevoLugar({ ...nuevoLugar, especialMensaje: e.target.value })}
                  className="bg-white text-black placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Aportación acumulada (EUR)</label>
                <Input
                  placeholder="0"
                  value={nuevoLugar.aportacionAcumulada}
                  onChange={(e) => setNuevoLugar({ ...nuevoLugar, aportacionAcumulada: e.target.value })}
                  className="bg-white text-black placeholder:text-gray-500"
                />
              </div>
            </div>
          )}
        </div>

        <Button type="submit" className="bg-[#68B84B] hover:bg-green-700 text-white w-full">
          Registrar Lugar
        </Button>
      </form>

      {/* ===== Fondo actual del cartel ===== */}
      <div className="mt-10 bg-[#D4FFD0] p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">🎨 Fondo actual del cartel</h2>

        {esAdmin ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fondos.map((fondo) => (
                <div
                  key={fondo.id}
                  onClick={() => handleSeleccionarFondo(fondo.id, fondo.url)}
                  className={`cursor-pointer border-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                    fondo.url === fondoSeleccionado ? 'border-blue-600' : 'border-transparent'
                  }`}
                >
                  <Image src={fondo.url} alt={fondo.nombre} width={350} height={220} className="object-cover w-full h-36" />
                  <div className="bg-white py-1 text-center font-medium text-black">{fondo.nombre}</div>
                </div>
              ))}
            </div>
            {fondoSeleccionado && (
              <div className="mt-4">
                <p className="font-semibold text-[#1F1F1F]">Vista previa del fondo actual:</p>
                <Image src={fondoSeleccionado} alt="Fondo seleccionado" width={700} height={460} className="rounded-lg mt-2 border" />
              </div>
            )}
          </>
        ) : (
          fondoSeleccionado && (
            <div className="text-center">
              <Image src={fondoSeleccionado} alt="Fondo actual" width={700} height={460} className="rounded-lg border mx-auto" />
            </div>
          )
        )}
      </div>

      {/* ===== Lista ===== */}
      <div className="mt-10 bg-[#E5FFD5] p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-4 text-[#1F1F1F]">Lugares Registrados</h2>
        <Input
          placeholder="Buscar por cualquier campo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="mb-4 bg-white text-black placeholder:text-gray-500"
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
                <th className="p-2">QR</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lugaresFiltrados.map((lugar) => (
                <tr key={lugar.id} className="border-b hover:bg-[#f9f9f9]">
                  <td className="p-2 font-semibold text-black">#{lugar.id}</td>
                  <td className="p-2 text-black">{lugar.nombre}</td>
                  <td className="p-2 text-black">{lugar.direccion}</td>
                  <td className="p-2 text-black">{lugar.agente?.nombre || '-'}</td>
                  <td className="p-2 text-black">{fmtPct(lugar.pctCliente)}</td>
                  <td className="p-2 text-black">{fmtPct(lugar.pctLugar)}</td>
                  <td className="p-2 text-xs break-all text-black">{lugar.qrCode}</td>
                  <td className="p-2 flex flex-col md:flex-row gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => abrirEdicion(lugar)}>
                      Editar
                    </Button>
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => router.push(`/lugares/${lugar.id}/detalle`)}>
                      Ver
                    </Button>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => router.push(`/lugares/cartel/${lugar.id}`)}>
                      Generar cartel
                    </Button>
                    <a
                      className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                      href={`https://impulsoenergetico.es/registro?agenteId=${encodeURIComponent(
                        lugar.agenteId,
                      )}&lugarId=${encodeURIComponent(lugar.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Probar landing
                    </a>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleEliminar(lugar.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Modal edición ===== */}
      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Lugar</DialogTitle>
          </DialogHeader>

          {lugarEditando && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">Nombre</label>
                  <Input
                    value={lugarEditando.nombre}
                    onChange={(e) => setLugarEditando({ ...lugarEditando, nombre: e.target.value })}
                    className="bg-white text-black placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">Dirección</label>
                  <Input
                    value={lugarEditando.direccion}
                    onChange={(e) => setLugarEditando({ ...lugarEditando, direccion: e.target.value })}
                    className="bg-white text-black placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">% Cliente (15 o 0.15)</label>
                  <Input
                    value={lugarEditando.pctCliente ?? ''}
                    onChange={(e) => setLugarEditando({ ...lugarEditando, pctCliente: e.target.value })}
                    className="bg-white text-black placeholder:text-gray-500"
                    placeholder="15 o 0.15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">% Lugar (10 o 0.10)</label>
                  <Input
                    value={lugarEditando.pctLugar ?? ''}
                    onChange={(e) => setLugarEditando({ ...lugarEditando, pctLugar: e.target.value })}
                    className="bg-white text-black placeholder:text-gray-500"
                    placeholder="10 o 0.10"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-[1fr_auto_auto] gap-4 items-end">
                <div>
                  <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">Código QR</label>
                  <Input
                    value={lugarEditando.qrCode ?? ''}
                    onChange={(e) => setLugarEditando({ ...lugarEditando, qrCode: e.target.value })}
                    className="bg-white text-black placeholder:text-gray-500"
                  />
                </div>
                <Button onClick={generarQRModal} className="bg-blue-600 text-white h-10">
                  Generar QR
                </Button>
                {lugarEditando.qrCode && (
                  <div className="p-1 bg-white rounded">
                    <QRCode value={`https://impulsoenergetico.es/comparador?qr=${lugarEditando.qrCode}`} size={64} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1F1F1F] mb-1">Agente</label>
                <select
                  className="w-full border px-4 py-2 rounded bg-white text-black"
                  value={lugarEditando.agenteId}
                  onChange={(e) => setLugarEditando({ ...lugarEditando, agenteId: e.target.value })}
                >
                  <option value="">Selecciona un agente</option>
                  {agentes.map((agente) => (
                    <option key={agente.id} value={agente.id}>
                      {agente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* ===== Especial (edición) ===== */}
              <div className="rounded-xl border border-emerald-300 bg-white p-4">
                <div className="flex items-center gap-3">
                  <input
                    id="chk-especial-edit"
                    type="checkbox"
                    checked={!!lugarEditando.especial}
                    onChange={(e) => setLugarEditando({ ...lugarEditando, especial: e.target.checked })}
                  />
                  <label htmlFor="chk-especial-edit" className="font-semibold text-emerald-800">
                    Lugar especial
                  </label>
                </div>

                {!!lugarEditando.especial && (
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">Logo (subir imagen)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadLogoEdit(e.target.files?.[0] || undefined)}
                          className="text-sm"
                        />
                        {subiendoLogoEdit && <span className="text-sm text-gray-600">Subiendo…</span>}
                        {lugarEditando.especialLogoUrl && (
                          <Button
                            type="button"
                            className="bg-gray-200 text-black"
                            onClick={() => setLugarEditando({ ...lugarEditando, especialLogoUrl: '' })}
                          >
                            Quitar
                          </Button>
                        )}
                      </div>
                      {lugarEditando.especialLogoUrl && (
                        <div className="mt-2">
                          <Image
                            src={lugarEditando.especialLogoUrl}
                            alt="Logo especial"
                            width={120}
                            height={120}
                            className="rounded-md border"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">Color destacado (hex)</label>
                      <Input
                        placeholder="#FF7A3B"
                        value={lugarEditando.especialColor ?? ''}
                        onChange={(e) => setLugarEditando({ ...lugarEditando, especialColor: e.target.value })}
                        className="bg-white text-black placeholder:text-gray-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-1">Mensaje promocional</label>
                      <Input
                        placeholder='Ej.: "AYUDA A TU CLUB"'
                        value={lugarEditando.especialMensaje ?? ''}
                        onChange={(e) => setLugarEditando({ ...lugarEditando, especialMensaje: e.target.value })}
                        className="bg-white text-black placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">Aportación acumulada (EUR)</label>
                      <Input
                        placeholder="0"
                        value={lugarEditando.aportacionAcumulada ?? ''}
                        onChange={(e) => setLugarEditando({ ...lugarEditando, aportacionAcumulada: e.target.value })}
                        className="bg-white text-black placeholder:text-gray-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleGuardarEdicion} className="bg-[#68B84B] hover:bg-green-700 text-white w-full">
                Guardar Cambios
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
