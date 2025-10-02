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

type Fondo = {
  id: number;
  nombre: string;
  url: string;
  activo?: boolean;
};

const fmtPct = (v: any) => (v == null ? '—' : `${(Number(v) * 100).toFixed(1)}%`);

export default function RegistrarLugar() {
  const router = useRouter();
  const sessionData = useSession();
  const session = sessionData?.data;
  const esAdmin = session?.user?.role === 'ADMIN';

  const [agentes, setAgentes] = useState<any[]>([]);
  const [lugares, setLugares] = useState<any[]>([]);
  const [codigoQR, setCodigoQR] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [lugarEditando, setLugarEditando] = useState<any | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [fondos, setFondos] = useState<Fondo[]>([]);
  const [fondoSeleccionado, setFondoSeleccionado] = useState<string>('');

  // Alta de lugar
  const [nuevoLugar, setNuevoLugar] = useState({
    nombre: '',
    direccion: '',
    qrCode: '',
    agenteId: '',
    pctCliente: '',
    pctLugar: '',
  });

  // Alta: modo especial
  const [nuevoEspecial, setNuevoEspecial] = useState(false);
  const [nuevoEspecialMensaje, setNuevoEspecialMensaje] = useState('');
  const [nuevoEspecialColor, setNuevoEspecialColor] = useState('#FFC857');
  const [nuevoAportacion, setNuevoAportacion] = useState<number>(0);
  const [nuevoEspecialLogoUrl, setNuevoEspecialLogoUrl] = useState('');
  const [subiendoLogoNuevo, setSubiendoLogoNuevo] = useState(false);

  // Edición: subir logo
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
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
    };
    fetchData();
  }, []);

  const generarQR = () => {
    const nuevoQR = uuidv4();
    setCodigoQR(nuevoQR);
    setNuevoLugar((s) => ({ ...s, qrCode: nuevoQR }));
  };

  const generarQRModal = () => {
    const nuevoQR = uuidv4();
    setLugarEditando((s: any) => ({ ...s, qrCode: nuevoQR }));
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar este lugar?')) return;
    await fetch(`/api/lugares/${id}`, { method: 'DELETE' });
    setLugares((arr) => arr.filter((l) => l.id !== id));
  };

  const subirLogoModal = async (file?: File) => {
    if (!file || !lugarEditando) return;
    try {
      setSubiendoLogo(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'impulso_carteles');
      const res = await fetch('https://api.cloudinary.com/v1_1/dhkzxihjg/image/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data?.secure_url) throw new Error('Upload error');
      setLugarEditando((s: any) => ({ ...s, especialLogoUrl: data.secure_url }));
    } finally { setSubiendoLogo(false); }
  };

  const subirLogoNuevoLugar = async (file?: File) => {
    if (!file) return;
    try {
      setSubiendoLogoNuevo(true);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'impulso_carteles');
      const res = await fetch('https://api.cloudinary.com/v1_1/dhkzxihjg/image/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data?.secure_url) throw new Error('Upload error');
      setNuevoEspecialLogoUrl(data.secure_url);
    } finally { setSubiendoLogoNuevo(false); }
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
        // especial
        especial: !!lugarEditando.especial,
        logo: lugarEditando.especialLogoUrl,
        color: lugarEditando.especialColor,
        mensajeCorto: lugarEditando.especialMensaje,
        aportacionAcumulada: lugarEditando.aportacionAcumulada,
      }),
    });
    const actualizado = await res.json();
    setLugares((arr) => arr.map((l) => (l.id === actualizado.id ? actualizado : l)));
    setLugarEditando(null);
    setMostrarModal(false);
  };

  const handleRegistrarLugar = async (e: any) => {
    e.preventDefault();

    const payload: any = { ...nuevoLugar };
    if (nuevoEspecial) {
      payload.especial = true;
      payload.mensajeCorto = nuevoEspecialMensaje;
      payload.color = nuevoEspecialColor;
      payload.aportacionAcumulada = nuevoAportacion;
      if (nuevoEspecialLogoUrl) payload.logo = nuevoEspecialLogoUrl;
    }

    const res = await fetch('/api/lugares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLugares((arr) => [data, ...arr]);

    // reset
    setNuevoLugar({ nombre: '', direccion: '', qrCode: '', agenteId: '', pctCliente: '', pctLugar: '' });
    setCodigoQR('');
    setNuevoEspecial(false);
    setNuevoEspecialMensaje('');
    setNuevoEspecialColor('#FFC857');
    setNuevoAportacion(0);
    setNuevoEspecialLogoUrl('');
  };

  const handleSeleccionarFondo = async (id: number, url: string) => {
    await fetch('/api/fondos/seleccionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setFondoSeleccionado(url);
  };

  const lugaresFiltrados = lugares.filter((lugar) => {
    const texto = `${lugar.id} ${lugar.nombre} ${lugar.direccion} ${lugar.qrCode} ${lugar.agente?.nombre} ${fmtPct(lugar.pctCliente)} ${fmtPct(lugar.pctLugar)} ${lugar.especial ? 'especial' : ''}`;
    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

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

      {/* ====== ALTA DE LUGAR ====== */}
      <form onSubmit={handleRegistrarLugar} className="bg-[#F6FFEC] p-6 rounded-xl shadow-md space-y-5">
        <div>
          <h3 className="font-bold text-[#1F1F1F] mb-2">Datos básicos</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Nombre del lugar</label>
              <Input placeholder="Ej: Club Deportivo Impulso" value={nuevoLugar.nombre} onChange={(e) => setNuevoLugar({ ...nuevoLugar, nombre: e.target.value })} className="bg-white text-black" />
            </div>
            <div>
              <label className="text-sm font-semibold">Dirección</label>
              <Input placeholder="Ciudad / Provincia" value={nuevoLugar.direccion} onChange={(e) => setNuevoLugar({ ...nuevoLugar, direccion: e.target.value })} className="bg-white text-black" />
            </div>
            <div>
              <label className="text-sm font-semibold">% Cliente (ej. 15 o 0.15)</label>
              <Input placeholder="15 o 0.15" value={nuevoLugar.pctCliente} onChange={(e) => setNuevoLugar({ ...nuevoLugar, pctCliente: e.target.value })} className="bg-white text-black" />
            </div>
            <div>
              <label className="text-sm font-semibold">% Lugar (ej. 10 o 0.10)</label>
              <Input placeholder="10 o 0.10" value={nuevoLugar.pctLugar} onChange={(e) => setNuevoLugar({ ...nuevoLugar, pctLugar: e.target.value })} className="bg-white text-black" />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-sm font-semibold">QR generado</label>
                <Input readOnly placeholder="(genera un QR)" value={nuevoLugar.qrCode} className="bg-white text-black" />
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" onClick={generarQR} className="bg-blue-600 hover:bg-blue-700 text-white h-10 mt-6">
                  Generar QR
                </Button>
                {codigoQR && <QRCode value={`https://impulsoenergetico.es/comparador?qr=${codigoQR}`} size={56} />}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold">Agente asignado</label>
              <select className="w-full border px-4 py-2 rounded bg-white text-black" value={nuevoLugar.agenteId} onChange={(e) => setNuevoLugar({ ...nuevoLugar, agenteId: e.target.value })}>
                <option value="">Selecciona un agente</option>
                {agentes.map((agente) => (
                  <option key={agente.id} value={agente.id}>{agente.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-dashed" />

        <div>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={nuevoEspecial} onChange={(e) => setNuevoEspecial(e.target.checked)} />
            Activar <b>modo especial</b> en la landing
          </label>

          {nuevoEspecial && (
            <div className="mt-3 grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Mensaje corto (ej. “AYUDA A TU CLUB”)</label>
                <input className="w-full border rounded px-3 py-2 mt-1" value={nuevoEspecialMensaje} onChange={(e) => setNuevoEspecialMensaje(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-semibold">Color (HEX)</label>
                <div className="flex items-center gap-3 mt-1">
                  <input type="color" value={nuevoEspecialColor} onChange={(e) => setNuevoEspecialColor(e.target.value)} className="h-10 w-16 border rounded" />
                  <input className="flex-1 border rounded px-3 py-2" value={nuevoEspecialColor} onChange={(e) => setNuevoEspecialColor(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Aportación acumulada (€)</label>
                <input type="number" min={0} className="w-full border rounded px-3 py-2 mt-1" value={Number(nuevoAportacion)} onChange={(e) => setNuevoAportacion(Number(e.target.value || 0))} />
              </div>

              <div>
                <label className="text-sm font-semibold">Logo / Escudo</label>
                {nuevoEspecialLogoUrl && (
                  <div className="mt-2">
                    <img src={nuevoEspecialLogoUrl} alt="logo" className="h-16 rounded-xl border p-2 bg-white" />
                  </div>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="https://…/logo.png"
                    value={nuevoEspecialLogoUrl}
                    onChange={(e) => setNuevoEspecialLogoUrl(e.target.value)}
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => subirLogoNuevoLugar(e.target.files?.[0] || undefined)} />
                    {subiendoLogoNuevo ? 'Subiendo…' : 'Subir'}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button type="submit" className="bg-[#68B84B] hover:bg-green-700 text-white w-full">Registrar Lugar</Button>
      </form>

      {/* ====== FONDO ACTUAL DEL CARTEL ====== */}
      <div className="mt-10 bg-[#D4FFD0] p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-[#1F1F1F] mb-4">🎨 Fondo actual del cartel</h2>
        {esAdmin ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fondos.map((fondo) => (
                <div key={fondo.id} onClick={() => handleSeleccionarFondo(fondo.id, fondo.url)} className={`cursor-pointer border-4 rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 ${fondo.url === fondoSeleccionado ? 'border-blue-600' : 'border-transparent'}`}>
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

      {/* ====== LISTA ====== */}
      <div className="mt-10 bg-[#E5FFD5] p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-4 text-[#1F1F1F]">Lugares Registrados</h2>
        <Input placeholder="Buscar por cualquier campo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="mb-4 bg-white text-black" />
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
                <th className="p-2">Estado</th>
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
                  <td className="p-2">
                    {lugar.especial ? (
                      <span className="inline-block text-xs font-bold px-2 py-1 rounded-full bg-pink-100 text-pink-700 border border-pink-300">⭐ Especial</span>
                    ) : (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border">Normal</span>
                    )}
                  </td>
                  <td className="p-2 flex flex-col md:flex-row gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setLugarEditando(lugar); setMostrarModal(true); }}>Editar</Button>
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => router.push(`/lugares/${lugar.id}/detalle`)}>Ver</Button>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => router.push(`/lugares/cartel/${lugar.id}`)}>Generar cartel</Button>
                    <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleEliminar(lugar.id)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== MODAL EDICIÓN ====== */}
      <Dialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Lugar</DialogTitle></DialogHeader>
          {lugarEditando && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Nombre</label>
                  <Input value={lugarEditando.nombre} onChange={(e) => setLugarEditando({ ...lugarEditando, nombre: e.target.value })} className="text-black" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Dirección</label>
                  <Input value={lugarEditando.direccion} onChange={(e) => setLugarEditando({ ...lugarEditando, direccion: e.target.value })} className="text-black" />
                </div>

                <div>
                  <label className="text-sm font-semibold">% Cliente (15 o 0.15)</label>
                  <Input value={lugarEditando.pctCliente ?? ''} onChange={(e) => setLugarEditando({ ...lugarEditando, pctCliente: e.target.value })} className="text-black" />
                </div>
                <div>
                  <label className="text-sm font-semibold">% Lugar (10 o 0.10)</label>
                  <Input value={lugarEditando.pctLugar ?? ''} onChange={(e) => setLugarEditando({ ...lugarEditando, pctLugar: e.target.value })} className="text-black" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-semibold">QR</label>
                  <Input value={lugarEditando.qrCode ?? ''} readOnly className="text-black" />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={generarQRModal} className="bg-blue-600 text-white h-10 mt-6">Generar QR</Button>
                  {lugarEditando.qrCode && <QRCode value={`https://impulsoenergetico.es/comparador?qr=${lugarEditando.qrCode}`} size={56} />}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Agente</label>
                <select className="w-full border px-4 py-2 rounded bg-white text-black" value={lugarEditando.agenteId} onChange={(e) => setLugarEditando({ ...lugarEditando, agenteId: e.target.value })}>
                  <option value="">Selecciona un agente</option>
                  {agentes.map((agente) => (
                    <option key={agente.id} value={agente.id}>{agente.nombre}</option>
                  ))}
                </select>
              </div>

              <hr className="border-dashed" />

              <div>
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" checked={!!lugarEditando.especial} onChange={(e) => setLugarEditando({ ...lugarEditando, especial: e.target.checked })} />
                  Activar <b>modo especial</b> en la landing
                </label>

                {lugarEditando.especial && (
                  <div className="mt-3 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold">Mensaje corto</label>
                      <input className="w-full border rounded px-3 py-2 mt-1" value={lugarEditando.especialMensaje ?? ''} onChange={(e) => setLugarEditando({ ...lugarEditando, especialMensaje: e.target.value })} />
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Color (HEX)</label>
                      <div className="flex items-center gap-3 mt-1">
                        <input type="color" value={lugarEditando.especialColor ?? '#FFC857'} onChange={(e) => setLugarEditando({ ...lugarEditando, especialColor: e.target.value })} className="h-10 w-16 border rounded" />
                        <input className="flex-1 border rounded px-3 py-2" value={lugarEditando.especialColor ?? '#FFC857'} onChange={(e) => setLugarEditando({ ...lugarEditando, especialColor: e.target.value })} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Aportación acumulada (€)</label>
                      <input type="number" min={0} className="w-full border rounded px-3 py-2 mt-1" value={Number(lugarEditando.aportacionAcumulada ?? 0)} onChange={(e) => setLugarEditando({ ...lugarEditando, aportacionAcumulada: Number(e.target.value || 0) })} />
                    </div>

                    <div>
                      <label className="text-sm font-semibold">Logo / Escudo</label>
                      {lugarEditando.especialLogoUrl && (
                        <div className="mt-2">
                          <img src={lugarEditando.especialLogoUrl} alt="logo" className="h-16 rounded-xl border p-2 bg-white" />
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="https://…/logo.png"
                          value={lugarEditando.especialLogoUrl ?? ''}
                          onChange={(e) => setLugarEditando({ ...lugarEditando, especialLogoUrl: e.target.value })}
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => subirLogoModal(e.target.files?.[0] || undefined)} />
                          {subiendoLogo ? 'Subiendo…' : 'Subir'}
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={handleGuardarEdicion} className="bg-[#68B84B] hover:bg-green-700 text-white w-full">Guardar Cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
