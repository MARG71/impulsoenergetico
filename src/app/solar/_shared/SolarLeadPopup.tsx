"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type ProductoNecesario =
  | "fotovoltaica"
  | "baterias"
  | "aerotermia"
  | "cargadores_ve"
  | "aislamiento"
  | "otro";

function getLS(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const SS_SHOWN_ONCE = "impulso_solar_popup_shown_once_session";
const SS_LAST_CLOSE = "impulso_solar_popup_last_close_ts_session";

export default function SolarLeadPopup() {
  const pathname = usePathname();
  const disabled = pathname?.startsWith("/solar/estudio");

  const [open, setOpen] = useState(false);

  // Form
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cp, setCp] = useState("");
  const [producto, setProducto] = useState<ProductoNecesario>("fotovoltaica");
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Timings solicitados
  const firstDelaySeconds = 30;
  const repeatDelaySeconds = 60;

  const timerRef = useRef<number | null>(null);

  const delayMs = useMemo(() => {
    if (typeof window === "undefined") return firstDelaySeconds * 1000;
    const shownOnce = sessionStorage.getItem(SS_SHOWN_ONCE) === "1";
    return (shownOnce ? repeatDelaySeconds : firstDelaySeconds) * 1000;
  }, [firstDelaySeconds, repeatDelaySeconds, pathname]);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const openPopup = () => {
    // ✅ protección anti-doble trigger
    if (open || disabled) return;
    setOpen(true);
    sessionStorage.setItem(SS_SHOWN_ONCE, "1");
  };

  const schedule = () => {
    clearTimer();
    if (disabled) return;

    // ✅ evita rearmar si ya está abierto
    if (open) return;

    // Evita que se reabra inmediatamente si lo cerró hace muy poco
    const lastClose = Number(sessionStorage.getItem(SS_LAST_CLOSE) || "0");
    const now = Date.now();
    if (now - lastClose < 10_000) return;

    timerRef.current = window.setTimeout(() => {
      openPopup();
    }, delayMs);
  };

  // IMPORTANTE: “cada vez que entras en una opción” se rearma
  useEffect(() => {
    if (disabled) return;
    schedule();
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, disabled, delayMs]);

  // Exit-intent (solo desktop)
  useEffect(() => {
    if (disabled) return;

    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        openPopup();
      }
    };

    window.addEventListener("mouseout", onMouseOut);
    return () => window.removeEventListener("mouseout", onMouseOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, open]);

  const close = () => {
    setOpen(false);
    sessionStorage.setItem(SS_LAST_CLOSE, String(Date.now()));

    // Reprograma para reaparecer según regla de 60s
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      if (!disabled) {
        setOpen(true);
        sessionStorage.setItem(SS_SHOWN_ONCE, "1");
      }
    }, repeatDelaySeconds * 1000);
  };

  const submit = async () => {
    setOkMsg(null);
    setErrMsg(null);

    if (!nombre.trim()) return setErrMsg("Añade tu nombre.");
    if (!telefono.trim()) return setErrMsg("Añade tu teléfono.");
    if (!email.trim()) return setErrMsg("Añade tu email.");
    if (!cp.trim()) return setErrMsg("Añade tu código postal.");

    const agenteId = getLS("agenteId");
    const lugarId = getLS("lugarId");

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          codigoPostal: cp,
          productoNecesario: producto,
          origen: "popup-solar",
          agenteId: agenteId ? Number(agenteId) : undefined,
          lugarId: lugarId ? Number(lugarId) : undefined,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "No se pudo enviar el formulario.");
      }

      setOkMsg("¡Perfecto! Te contactamos en breve.");
      setErrMsg(null);

      window.setTimeout(() => setOpen(false), 1200);
    } catch (e: any) {
      setErrMsg(e?.message || "Error enviando el formulario.");
    } finally {
      setLoading(false);
    }
  };

  if (disabled) return null;
  if (!open) return null;

  const productBtn = (key: ProductoNecesario, label: string) => {
    const active = producto === key;
    return (
      <button
        type="button"
        onClick={() => setProducto(key)}
        className={[
          "rounded-xl border px-3 py-2 text-sm font-semibold transition",
          active
            ? "border-[#FFC107]/60 bg-[#FFC107]/10 text-[#FFE8A3]"
            : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#04110E] via-[#061513] to-[#2A1B00] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFC107]/30 bg-[#FFC107]/10 px-3 py-1 text-xs font-semibold text-[#FFE8A3]">
              Presupuesto · Solar
            </div>
            <h3 className="mt-3 text-2xl md:text-3xl font-extrabold">
              ¿Pensando en pasarte al autoconsumo?
            </h3>
            <p className="mt-1 text-white/75 text-base md:text-lg">
              Te llamamos y te decimos si te compensa en 3 minutos.
            </p>
          </div>

          <button
            onClick={close}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-0 md:grid-cols-2">
          <div className="relative min-h-[220px] bg-[radial-gradient(circle_at_top,rgba(255,193,7,0.28),transparent_55%)] p-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
              <p className="text-sm text-white/70">Descubre en menos de</p>
              <p className="mt-1 text-4xl md:text-5xl font-black text-[#FFE8A3]">3 minutos</p>
              <p className="mt-2 text-white/70">si tu instalación te sale a cuenta.</p>
              <p className="mt-4 text-xs text-white/50">
                Primera vez a los {firstDelaySeconds}s · luego cada {repeatDelaySeconds}s.
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-white/70">Nombre</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FFC107]/40"
                  placeholder="Tu nombre y apellidos"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FFC107]/40"
                  placeholder="tucorreo@..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FFC107]/40"
                  placeholder="Tu teléfono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/70">Código Postal</label>
                <input
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-[#FFC107]/40"
                  placeholder="CP"
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-white/70">¿Qué producto necesitas?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {productBtn("fotovoltaica", "Fotovoltaica")}
                {productBtn("baterias", "Baterías")}
                {productBtn("aerotermia", "Aerotermia")}
                {productBtn("cargadores_ve", "Cargadores VE")}
                {productBtn("aislamiento", "Aislamiento")}
                {productBtn("otro", "Otro")}
              </div>
            </div>

            {(okMsg || errMsg) && (
              <div
                className={[
                  "mt-4 rounded-xl border px-3 py-2 text-sm",
                  okMsg
                    ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                    : "border-red-300/30 bg-red-400/10 text-red-100",
                ].join(" ")}
              >
                {okMsg || errMsg}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                disabled={loading}
                onClick={submit}
                className="rounded-2xl bg-[#FFC107] px-5 py-3 font-extrabold text-black hover:opacity-95 disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Te llamamos"}
              </button>

              <a
                href="/solar/estudio"
                className="rounded-2xl border border-[#FFC107]/40 bg-transparent px-5 py-3 text-center font-extrabold text-[#FFE8A3] hover:bg-[#FFC107]/10"
              >
                Solicitar estudio gratis
              </a>
            </div>

            <p className="mt-4 text-xs text-white/50">
              Al enviar, aceptas contacto comercial. (Podemos añadir checkbox RGPD si lo necesitas)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
