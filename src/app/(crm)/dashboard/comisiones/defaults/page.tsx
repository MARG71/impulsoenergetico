// src/app/(crm)/dashboard/comisiones/defaults/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

type Defaults = {
  id: number;
  defaultPctCliente: number; // 0..1
  defaultPctLugar: number;   // 0..1 (remanente)
  defaultPctAgente: number;  // 0..1 (remanente)
};

export default function DefaultsComisionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const role = (session?.user as any)?.role as
    | 'SUPERADMIN'
    | 'ADMIN'
    | 'AGENTE'
    | 'LUGAR'
    | 'CLIENTE'
    | undefined;

  // ✅ modo tenant solo para SUPERADMIN => ?adminId=...
  const adminIdParam = searchParams?.get('adminId');
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;
  const isValidAdminContext =
    role === 'SUPERADMIN' &&
    typeof adminIdContext === 'number' &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  // query para las llamadas a la API
  const adminQuery =
    role === 'SUPERADMIN' && isValidAdminContext && adminIdContext
      ? `?adminId=${adminIdContext}`
      : '';

  // helper para navegar respetando el tenant
  const pushTenant = (href: string) => {
    if (role === 'SUPERADMIN' && isValidAdminContext && adminIdContext) {
      const hasQuery = href.includes('?');
      router.push(`${href}${hasQuery ? '&' : '?'}adminId=${adminIdContext}`);
    } else {
      router.push(href);
    }
  };

  const [data, setData] = useState<Defaults | null>(null);
  const [cliente, setCliente] = useState('');
  const [lugar, setLugar]     = useState('');
  const [agente, setAgente]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  // Helpers
  const asFrac = (v: string) => {
    const n = Number(String(v).replace(',', '.'));
    if (Number.isNaN(n)) return NaN;
    return n > 1 ? n / 100 : n; // "15" => 0.15
  };
  const asPct = (f: number) => `${(f * 100).toFixed(1)}%`;

  // ✅ Solo ADMIN o SUPERADMIN
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !role) return;

    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      router.push('/unauthorized');
    }
  }, [session, status, role, router]);

  // Cargar defaults (teniendo en cuenta el tenant si lo hay)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/comisiones/defaults${adminQuery}`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (res.ok) {
          setData(json);
          setCliente(json?.defaultPctCliente?.toString() ?? '0');
          setLugar(json?.defaultPctLugar?.toString() ?? '0');
          setAgente(json?.defaultPctAgente?.toString() ?? '0');
        } else {
          setMsg(json?.error ?? 'Error al cargar');
        }
      } catch {
        setMsg('Error al cargar');
      }
    })();
  }, [adminQuery]);

  // Vista previa
  const preview = useMemo(() => {
    const pool = 100;
    const pCliente = asFrac(cliente);
    const pLugar   = asFrac(lugar);
    const pAgente  = asFrac(agente);

    if ([pCliente, pLugar, pAgente].some(isNaN)) return null;
    if (pLugar + pAgente > 1) return { error: 'Lugar + Agente excede el 100% del remanente' };
    if (pCliente < 0 || pCliente > 1 || pLugar < 0 || pLugar > 1 || pAgente < 0 || pAgente > 1) {
      return { error: 'Todos los porcentajes deben estar entre 0 y 1 (o 0% y 100%)' };
    }

    const clienteEur = pool * pCliente;
    const remanente  = pool - clienteEur;
    const agenteEur  = remanente * pAgente;
    const lugarEur   = remanente * pLugar;
    const adminEur   = remanente - agenteEur - lugarEur;

    return { pool, clienteEur, agenteEur, lugarEur, adminEur };
  }, [cliente, lugar, agente]);

  // Guardar
  const guardar = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`/api/comisiones/defaults${adminQuery}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultPctCliente: cliente,
          defaultPctLugar: lugar,
          defaultPctAgente: agente,
        }),
      });
      const json = await res.json();
      if (!res.ok) setMsg(json?.error ?? 'Error');
      else {
        setData(json);
        setMsg('Guardado ✅');
      }
    } catch {
      setMsg('Error de red');
    } finally {
      setSaving(false);
    }
  };

  // Estilos base de input (texto oscuro, borde, foco accesible)
  const inputClass =
    'bg.white text-[#111] placeholder:text-[#6b7280] border border-gray-300 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-[#68B84B]';

  return (
    <div className="min-h-screen bg-[#F4FAEE]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#F4FAEE] via-[#F4FAEE]/95 to-[#F4FAEE] backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
              alt="Impulso Energético"
              width={160}
              height={48}
              priority
            />
            <span className="hidden md:inline text-[#1F1F1F] font-medium">
              CRM · Comisiones · Defaults
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => pushTenant('/dashboard')}
              className="bg-[#F0C300] text.black hover:bg-yellow-400"
            >
              🏠 Dashboard
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1F1F1F] mb-5">
          Defaults globales de comisión
        </h1>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] p-6 md:p-7">
          <p className="text-[15px] text-[#374151] mb-6 leading-relaxed">
            Estos porcentajes se aplican cuando un Lugar/Agente no tiene valores propios ni existe
            un override.
            <br />
            <strong>Cliente</strong> se aplica sobre el <strong>pool</strong>; <strong>Lugar</strong>{' '}
            y <strong>Agente</strong> sobre el <strong>remanente</strong>.
          </p>

          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111] mb-1">
                % Cliente (pool)
              </label>
              <Input
                inputMode="decimal"
                className={inputClass}
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="ej. 15 o 0.15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111] mb-1">
                % Lugar (remanente)
              </label>
              <Input
                inputMode="decimal"
                className={inputClass}
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="ej. 10 o 0.10"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111] mb-1">
                % Agente (remanente)
              </label>
              <Input
                inputMode="decimal"
                className={inputClass}
                value={agente}
                onChange={(e) => setAgente(e.target.value)}
                placeholder="ej. 20 o 0.20"
              />
            </div>
          </div>

          {/* Botón y mensajes */}
          <div className="mt-5 flex items-center gap-3">
            <Button
              onClick={guardar}
              disabled={saving}
              className="bg-[#68B84B] text-white hover:bg-[#499a2f] px-6"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            {msg && (
              <span
                className={`text-sm ${
                  msg.includes('✅') ? 'text-[#15803d] font-medium' : 'text-[#dc2626]'
                }`}
              >
                {msg}
              </span>
            )}
          </div>

          {/* Vista previa */}
          <div className="mt-7 rounded-xl border border-[#e5e7eb] bg-[#FFFBEF] p-5">
            <div className="font-semibold text-[#111] mb-3">Vista previa con pool = 100€</div>
            {preview && !('error' in preview) ? (
              <ul className="text-[15px] leading-7 text-[#111]">
                <li>
                  Cliente: <strong>{asPct(asFrac(cliente))}</strong> →{' '}
                  {preview.clienteEur.toFixed(2)} €
                </li>
                <li>
                  Agente: <strong>{asPct(asFrac(agente))}</strong> del remanente →{' '}
                  {preview.agenteEur.toFixed(2)} €
                </li>
                <li>
                  Lugar: <strong>{asPct(asFrac(lugar))}</strong> del remanente →{' '}
                  {preview.lugarEur.toFixed(2)} €
                </li>
                <li>Admin: (remanente - agente - lugar) → {preview.adminEur.toFixed(2)} €</li>
              </ul>
            ) : (
              <div className="text-[#dc2626] text-sm">
                {(preview as any)?.error ?? 'Completa los valores'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
