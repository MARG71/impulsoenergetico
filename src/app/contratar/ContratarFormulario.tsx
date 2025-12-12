"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

type TipoContratacion = "PERSONA_FISICA" | "AUTONOMO" | "EMPRESA";

type UploadKind =
  | "FACTURA"
  | "DNI_FRENTE"
  | "DNI_DORSO"
  | "RECIBO_AUTONOMO"
  | "CIF"
  | "OTRO";

type DocItem = { file: File; kind: UploadKind };

const requisitos: Record<TipoContratacion, { title: string; items: string[] }> = {
  PERSONA_FISICA: {
    title: "Persona física",
    items: [
      "DNI por las 2 caras (frontal y trasera).",
      "Factura completa (todas las páginas).",
      "Rellenar todos los datos obligatorios (*).",
    ],
  },
  AUTONOMO: {
    title: "Autónomo",
    items: [
      "DNI por las 2 caras (frontal y trasera).",
      "Factura completa (todas las páginas).",
      "Último recibo de autónomo (cargo en banco).",
      "Rellenar todos los datos obligatorios (*).",
    ],
  },
  EMPRESA: {
    title: "Empresa",
    items: [
      "DNI por las 2 caras (frontal y trasera).",
      "Factura completa (todas las páginas).",
      "CIF de la empresa (foto o documento).",
      "Rellenar todos los datos obligatorios (*).",
    ],
  },
};

const requiredKindsByTipo: Record<TipoContratacion, UploadKind[]> = {
  PERSONA_FISICA: ["DNI_FRENTE", "DNI_DORSO", "FACTURA"],
  AUTONOMO: ["DNI_FRENTE", "DNI_DORSO", "FACTURA", "RECIBO_AUTONOMO"],
  EMPRESA: ["DNI_FRENTE", "DNI_DORSO", "FACTURA", "CIF"],
};

export default function ContratarFormulario() {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ Dependencia estable para evitar warnings/rojos
  const spKey = sp.toString();

  const inputFilesRef = useRef<HTMLInputElement | null>(null);
  const inputCameraRef = useRef<HTMLInputElement | null>(null);

  // ✅ Evitar TS rojo con capture="environment" (se setea por JS)
  useEffect(() => {
    const el = inputCameraRef.current;
    if (el) el.setAttribute("capture", "environment");
  }, []);

  // metadata (viene del comparador)
  const meta = useMemo(() => {
    const agente = sp.get("agenteId") || sp.get("idAgente") || "";
    const lugar = sp.get("lugarId") || sp.get("idLugar") || "";
    return {
      ofertaId: sp.get("ofertaId") || "",
      compania: sp.get("compania") || "",
      tarifa: sp.get("tarifa") || "",
      agenteId: agente,
      lugarId: lugar,
      tipoCliente: sp.get("tipoCliente") || "RESIDENCIAL",
      nombreTarifa: sp.get("nombreTarifa") || "2.0TD",
      nombreCliente: sp.get("nombreCliente") || "",
      direccionCliente: sp.get("direccionCliente") || "",
    };
  }, [spKey]); // ✅

  // datos que mete el cliente
  const [tipoContratacion, setTipoContratacion] =
    useState<TipoContratacion>("PERSONA_FISICA");

  const [nombre, setNombre] = useState(meta.nombreCliente);
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [direccion, setDireccion] = useState(meta.direccionCliente);
  const [cups, setCups] = useState("");
  const [iban, setIban] = useState("");

  // ✅ ahora cada doc tiene su tipo
  const [uploadKind, setUploadKind] = useState<UploadKind>("FACTURA");
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);

  const addFiles = (list: FileList | null, kind: UploadKind) => {
    if (!list?.length) return;
    const arr = Array.from(list).map((file) => ({ file, kind }));

    const maxFiles = 12;
    const next = [...docs, ...arr].slice(0, maxFiles);
    setDocs(next);
  };

  const removeDoc = (idx: number) => {
    setDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    // Campos obligatorios (mínimos)
    if (!nombre.trim()) return "Falta el nombre.";
    if (!telefono.trim()) return "Falta el teléfono.";
    if (!direccion.trim()) return "Falta la dirección de suministro.";

    // Si quieres endurecer:
    // if (!dni.trim()) return "Falta DNI/NIE.";
    // if (!email.trim()) return "Falta email.";

    if (!docs.length) return "Debes subir la documentación obligatoria.";

    // Validación por tipo
    const required = requiredKindsByTipo[tipoContratacion];
    const missing = required.filter((k) => !docs.some((d) => d.kind === k));

    if (missing.length) {
      const mapLabel: Record<UploadKind, string> = {
        FACTURA: "Factura completa",
        DNI_FRENTE: "DNI (frontal)",
        DNI_DORSO: "DNI (trasera)",
        RECIBO_AUTONOMO: "Recibo autónomo",
        CIF: "CIF empresa",
        OTRO: "Otro",
      };
      return (
        "Falta documentación obligatoria: " +
        missing.map((m) => mapLabel[m]).join(", ")
      );
    }

    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      const fd = new FormData();

      // datos cliente
      fd.append("nombre", nombre);
      fd.append("apellidos", apellidos);
      fd.append("telefono", telefono);
      fd.append("email", email);
      fd.append("dni", dni);
      fd.append("direccion", direccion);
      fd.append("cups", cups);
      fd.append("iban", iban);

      // tipo contratación (nuevo)
      fd.append("tipoContratacion", tipoContratacion);

      // metadata
      fd.append("ofertaId", meta.ofertaId);
      fd.append("compania", meta.compania);
      fd.append("tarifa", meta.tarifa);
      fd.append("agenteId", meta.agenteId);
      fd.append("lugarId", meta.lugarId);
      fd.append("tipoCliente", meta.tipoCliente);
      fd.append("nombreTarifa", meta.nombreTarifa);

      // ✅ enviamos docs con su tipo (uno a uno)
      docs.forEach((d) => {
        fd.append("files", d.file, d.file.name);
        fd.append("filesKinds", d.kind);
      });

      const res = await fetch("/api/solicitudes-contrato", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert(data?.error || "No se pudo enviar la solicitud.");
        return;
      }

      alert("✅ Solicitud enviada. En breve te contactaremos.");
      router.push(
        `/bienvenida?agenteId=${encodeURIComponent(meta.agenteId)}&lugarId=${encodeURIComponent(
          meta.lugarId
        )}&nombre=${encodeURIComponent(nombre)}`
      );
    } catch (err) {
      console.error(err);
      alert("Error enviando la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-4 py-6 md:px-10 md:py-10 text-[15px] md:text-[16px] lg:text-[17px]">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Cabecera */}
        <div className="rounded-3xl bg-slate-950/95 border border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.35)] p-5 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-48 md:h-16 md:w-56">
                <Image
                  src="/logo-impulso.png"
                  alt="Impulso Energético"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-[12px] tracking-[0.25em] uppercase text-emerald-300 font-bold">
                  Contratación
                </p>
                <h1 className="text-3xl md:text-4xl font-extrabold">
                  Toma de datos y documentación
                </h1>
                <p className="text-sm md:text-base text-slate-300 mt-1 font-semibold">
                  {meta.compania ? (
                    <span className="font-extrabold text-emerald-200">
                      {meta.compania}
                    </span>
                  ) : null}
                  {meta.tarifa ? <span className="text-slate-300"> · {meta.tarifa}</span> : null}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-50 text-sm md:text-lg font-bold"
            >
              ⬅ Volver
            </button>
          </div>
        </div>

        {/* 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Form */}
          <form
            onSubmit={submit}
            className="lg:col-span-3 rounded-3xl bg-slate-950/90 border border-slate-800 p-5 md:p-6 shadow-[0_0_28px_rgba(15,23,42,0.9)] space-y-6"
          >
            {/* Tipo cliente */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
              <label className="block text-[15px] md:text-[16px] font-extrabold text-slate-200 mb-2">

                Tipo de cliente *
              </label>
              <select
                className="inp font-extrabold"
                value={tipoContratacion}
                onChange={(e) => setTipoContratacion(e.target.value as TipoContratacion)}
              >
                <option value="PERSONA_FISICA">Persona física</option>
                <option value="AUTONOMO">Autónomo</option>
                <option value="EMPRESA">Empresa</option>
              </select>
              <p className="mt-2 text-xs md:text-sm text-slate-300 font-semibold">
                Selecciona tu tipo para ver la documentación exacta que necesitamos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombre *">
                <input className="inp" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </Field>
              <Field label="Apellidos *">
                <input className="inp" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
              </Field>
              <Field label="Teléfono *">
                <input className="inp" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="inp" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="DNI/NIE">
                <input className="inp" value={dni} onChange={(e) => setDni(e.target.value)} />
              </Field>
              <Field label="CUPS (si lo tienes)">
                <input className="inp" value={cups} onChange={(e) => setCups(e.target.value)} />
              </Field>
              <Field label="Dirección de suministro *" className="md:col-span-2">
                <input className="inp" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </Field>
              <Field label="IBAN (si procede)" className="md:col-span-2">
                <input className="inp" value={iban} onChange={(e) => setIban(e.target.value)} />
              </Field>
            </div>

            {/* Docs */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-emerald-200">
                    Documentación
                  </h2>
                  <p className="text-sm md:text-base text-slate-300 font-semibold">
                    En ordenador puedes subir PDF/imagen. En móvil puedes hacer foto directamente.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 text-sm md:text-base font-extrabold"
                    value={uploadKind}
                    onChange={(e) => setUploadKind(e.target.value as UploadKind)}
                  >
                    <option value="FACTURA">Factura completa</option>
                    <option value="DNI_FRENTE">DNI (frontal)</option>
                    <option value="DNI_DORSO">DNI (trasera)</option>
                    <option value="RECIBO_AUTONOMO">Recibo autónomo</option>
                    <option value="CIF">CIF empresa</option>
                    <option value="OTRO">Otro</option>
                  </select>

                  <input
                    ref={inputFilesRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => addFiles(e.target.files, uploadKind)}
                  />
                  <input
                    ref={inputCameraRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e) => addFiles(e.target.files, uploadKind)}
                  />

                  <button
                    type="button"
                    onClick={() => inputFilesRef.current?.click()}
                    className="px-4 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sm md:text-lg font-bold"
                  >
                    📎 Subir archivos
                  </button>
                  <button
                    type="button"
                    onClick={() => inputCameraRef.current?.click()}
                    className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm md:text-lg font-extrabold"
                  >
                    📸 Hacer foto
                  </button>
                </div>
              </div>

              {docs.length === 0 ? (
                <div className="text-sm md:text-base text-slate-400 font-semibold">
                  Aún no has añadido documentos.
                </div>
              ) : (
                <ul className="space-y-2">
                  {docs.map((d, idx) => (
                    <li
                      key={`${d.file.name}-${idx}`}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2"
                    >
                      <div className="text-sm md:text-base">
                        <span className="font-extrabold text-slate-100">{d.file.name}</span>{" "}
                        <span className="text-slate-400 font-semibold">
                          ({Math.round(d.file.size / 1024)} KB) ·{" "}
                          <span className="text-emerald-200 font-extrabold">{labelKind(d.kind)}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDoc(idx)}
                        className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs md:text-sm font-bold"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end">
              <button
                disabled={loading}
                type="submit"
                className="px-8 py-3.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-lg font-extrabold shadow-[0_0_24px_rgba(16,185,129,0.55)] disabled:opacity-60"
              >
                {loading ? "Enviando…" : "Enviar solicitud"}
              </button>
            </div>
          </form>

          {/* Leyenda */}
          <aside className="rounded-3xl bg-slate-950/90 border border-emerald-500/30 p-6 md:p-7 shadow-[0_0_24px_rgba(16,185,129,0.25)] h-fit lg:sticky lg:top-6">
            <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-300">
              Documentación necesaria
            </h3>
            <p className="text-sm text-slate-300 mt-1 font-semibold">
              Seleccionado:{" "}
              <span className="text-slate-50 font-extrabold">
                {requisitos[tipoContratacion].title}
              </span>
            </p>

            <ul className="mt-4 space-y-2 text-base text-slate-100">
              {requisitos[tipoContratacion].items.map((r) => (
                <li key={r} className="font-semibold leading-relaxed">
                  ✅ {r}
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-2xl bg-slate-900/80 border border-slate-700 p-3 text-xs text-slate-300 font-semibold">
              💡 Consejo: primero sube la <span className="text-emerald-200 font-extrabold">Factura</span> y luego el{" "}
              <span className="text-emerald-200 font-extrabold">DNI (frontal y trasera)</span>.
            </div>

            <div className="mt-4 rounded-2xl bg-slate-900/80 border border-slate-700 p-3 text-xs text-slate-300 font-semibold">
              📱 En móvil: usa <span className="text-emerald-200 font-extrabold">Hacer foto</span> para fotografiar documentos.
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .inp {
            width: 100%;
            padding: 0.85rem 1rem;
            border-radius: 1rem;
            background: rgba(2, 6, 23, 0.75);
            border: 1px solid rgba(51, 65, 85, 1);
            color: #fff;
            outline: none;
            font-weight: 750;
            font-size: 1.05rem;
            }

        .inp:focus {
          box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.55);
          border-color: rgba(52, 211, 153, 0.8);
        }
      `}</style>
    </div>
  );
}

function labelKind(kind: UploadKind) {
  const map: Record<UploadKind, string> = {
    FACTURA: "Factura completa",
    DNI_FRENTE: "DNI (frontal)",
    DNI_DORSO: "DNI (trasera)",
    RECIBO_AUTONOMO: "Recibo autónomo",
    CIF: "CIF empresa",
    OTRO: "Otro",
  };
  return map[kind] ?? kind;
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[15px] md:text-[16px] font-extrabold text-slate-200 mb-2">

        {label}
      </label>
      {children}
    </div>
  );
}
