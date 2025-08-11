'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

type Defaults = {
  id: number;
  defaultPctCliente: number; // 0..1
  defaultPctLugar: number;   // 0..1 sobre remanente
  defaultPctAgente: number;  // 0..1 sobre remanente
};

export default function DefaultsComisionesPage() {
  const router = useRouter();
  const [data, setData] = useState<Defaults | null>(null);
  const [cliente, setCliente] = useState<string>(''); // aceptamos 15 o 0.15
  const [lugar, setLugar]     = useState<string>('');
  const [agente, setAgente]   = useState<string>('');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<string>('');

  const asFrac = (v: string) => {
    const n = Number(v.replace(',', '.'));
    if (Number.isNaN(n)) return NaN;
    return n > 1 ? n / 100 : n;
  };
  const asPct = (f: number) => `${(f * 100).toFixed(1)}%`;

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/comisiones/defaults', { cache: 'no-store' });
      const json = await res.json();
      setData(json);
      setCliente(json?.defaultPctCliente?.toString() ?? '0');
      setLugar(json?.defaultPctLugar?.toString() ?? '0');
      setAgente(json?.defaultPctAgente?.toString() ?? '0');
    })();
  }, []);

  const preview = useMemo(() => {
    const pool = 100; // ejemplo 100€
    const pCliente = asFrac(cliente);
    const pLugar   = asFrac(lugar);
    const pAgente  = asFrac(agente);

    if ([pCliente, pLugar, pAgente].some(isNaN)) return null;
    if (pLugar + pAgente > 1) return { error: 'Lugar + Agente excede el 100% del remanente' };

    const cliente€   = pool * pCliente;
    const remanente  = pool - cliente€;
    const agente€    = remanente * pAgente;
    const lugar€     = remanente * pLugar;
    const admin€     = remanente - agente€ - lugar€;

    return { pool, cliente€, agente€, lugar€, admin€ };
  }, [cliente, lugar, agente]);

  const guardar = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/comisiones/defaults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultPctCliente: cliente,
          defaultPctLugar: lugar,
          defaultPctAgente: agente,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json?.error ?? 'Error');
      } else {
        setData(json);
        setMsg('Guardado ✅');
      }
    } catch (e) {
      setMsg('Error de red');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-[#F6FFEC]">
      {/* Header con logo + navegación */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo-impulso.png" alt="Impulso Energético" width={160} height={48} priority />
          <span className="hidden md:inline text-[#1F1F1F]">CRM · Comisiones · Defaults</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-[#F0C300] text-black hover:bg-yellow-400">
            🏠 Dashboard
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[#1F1F1F] mb-4">Defaults globales de comisión</h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
        <p className="text-sm text-gray-600 mb-4">
          Estos porcentajes se aplican cuando un Lugar/Agente no tiene valores propios ni existe un override.
          Cliente se aplica sobre el <strong>pool</strong>; Lugar y Agente sobre el <strong>remanente</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1F1F1F] mb-1">% Cliente (pool)</label>
            <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="ej. 15 o 0.15" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1F1F1F] mb-1">% Lugar (remanente)</label>
            <Input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="ej. 10 o 0.10" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1F1F1F] mb-1">% Agente (remanente)</label>
            <Input value={agente} onChange={(e) => setAgente(e.target.value)} placeholder="ej. 20 o 0.20" />
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={guardar} disabled={saving} className="bg-[#68B84B] text-white hover:bg-green-700">
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
          {msg && <span className="ml-3 text-sm">{msg}</span>}
        </div>

        {preview && !('error' in preview) && (
          <div className="mt-6 bg-[#FFFCF0] border rounded-xl p-4">
            <div className="font-semibold mb-2">Vista previa con pool = 100€</div>
            <ul className="text-sm leading-7">
              <li>Cliente: <strong>{asPct(asFrac(cliente))}</strong> → {preview.cliente€.toFixed(2)} €</li>
              <li>Agente:  <strong>{asPct(asFrac(agente))}</strong> del remanente → {preview.agente€.toFixed(2)} €</li>
              <li>Lugar:   <strong>{asPct(asFrac(lugar))}</strong> del remanente → {preview.lugar€.toFixed(2)} €</li>
              <li>Admin:   (remanente - agente - lugar) → {preview.admin€.toFixed(2)} €</li>
            </ul>
          </div>
        )}
        {preview && 'error' in preview && (
          <div className="mt-4 text-red-600 text-sm">{preview.error}</div>
        )}
      </div>
    </div>
  );
}
