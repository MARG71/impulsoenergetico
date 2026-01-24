"use client";

import { useEffect, useMemo, useState } from "react";

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

function setLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export default function SolarLeadPopup() {
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

  const cooldownDays = 7;

  const lastShownKey = "impulso_solar_popup_last_shown";
  const dismissedKey = "impulso_solar_popup_dismissed"; // para si lo cierran

  const shouldShow = useMemo(() => {
    const dismissed = getLS(dismissedKey);
    if (dismissed === "1") return false;

    const lastShown = getLS(lastShownKey);
    if (!lastShown) return true;

    const last = Number(lastShown);
    if (!Number.isFinite(last)) return true;

    const diffMs = Date.now() - last;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= cooldownDays;
  }, []);

  useEffect(() => {
    if (!shouldShow) return;

    let opened = false;

    const openPopup = () => {
      if (opened) return;
      opened = true;
      setOpen(true);
      setLS(lastShownKey, String(Date.now()));
    };

    // 1) por tiempo
    const t = window.setTimeout(() => {
      openPopup();
    }, 25000); // 25s (ajustable)

    // 2) por scroll
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = (doc.scrollTop || document.body.scrollTop) / (doc.scrollHeight - doc.clientHeight);
      if (scrolled > 0.35) openPopup();
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [shouldShow]);

  const close = () => {
    setOpen(false);
    setLS(dismissedKey, "1"); // si lo cierra, no molesta más (si quieres solo "por sesión", lo cambiamos)
  };

  const submit = async () => {
    setOkMsg(null);
    setErrMsg(null);

    if (!nombre.trim()) return setErrMsg("Añade tu nombre.");
    if (!telefono.trim()) return setErrMsg("Añade tu teléfono.");
    if (!email.trim()) return setErrMsg("Añade tu email.");
    if (!cp.trim()) return setErrMsg("Añade tu código postal.");

    // Recuperamos tracking como en tu sistema (si existe)
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
          // campos extra
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

      // opcional: cerrar tras éxito
      window.setTimeout(() => setOpen(false), 1200);
    } catch (e: any) {
      setErrMsg(e?.message || "Error enviando el formulario.");
    } finally {
      setLoading(false);
    }
  };

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
            ? "border-emerald-300 bg-emerald-400/15 text-emerald-100"
            : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              Preguntas rápidas · Presupuesto
            </div>
            <h3 className="mt-3 text-2xl font-extrabold">¿Pensando en pasarte al autoconsumo?</h3>
            <p className="mt-1 text-white/70">Te llamamos y te decimos si te compensa en 3 minutos.</p>
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
          {/* Columna izquierda (visual) */}
          <div className="relative min-h-[240px] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.35),transparent_55%)] p-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
              <p className="text-sm text-white/70">Descubre en menos de</p>
              <p className="mt-1 text-4xl font-black text-emerald-200">3 minutos</p>
              <p className="mt-2 text-white/70">si tu instalación te sale a cuenta.</p>
              <p className="mt-4 text-xs text-white/50">
                (Este mensaje aparece ocasionalmente y no volverá a molestarte.)
              </p>
            </div>
          </div>

          {/* Columna derecha (form) */}
          <div className="p-6">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-white/70">Nombre</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-300/50"
                  placeholder="Tu nombre y apellidos"
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-white/70">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-300/50"
                  placeholder="tucorreo@..."
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-white/70">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-300/50"
                  placeholder="Tu teléfono"
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-xs font-semibold text-white/70">Código Postal</label>
                <input
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-300/50"
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
                  okMsg ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100" : "border-red-300/30 bg-red-400/10 text-red-100",
                ].join(" ")}
              >
                {okMsg || errMsg}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                disabled={loading}
                onClick={submit}
                className="rounded-2xl bg-emerald-400 px-5 py-3 font-extrabold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Te llamamos"}
              </button>

              <a
                href="/solar/estudio"
                className="rounded-2xl border border-emerald-300/40 bg-transparent px-5 py-3 text-center font-bold text-emerald-100 hover:bg-emerald-400/10"
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
