"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

type UploadKind = "DNI" | "FACTURA" | "OTRO";

export default function ContratarFormulario() {
  const router = useRouter();
  const sp = useSearchParams();

  const inputFilesRef = useRef<HTMLInputElement | null>(null);
  const inputCameraRef = useRef<HTMLInputElement | null>(null);

  // metadata (viene del comparador)
  const meta = useMemo(() => {
    const agente =
      sp.get("agenteId") || sp.get("idAgente") || "";
    const lugar =
      sp.get("lugarId") || sp.get("idLugar") || "";
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
  }, [sp]);

  // datos que mete el cliente
  const [nombre, setNombre] = useState(meta.nombreCliente);
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [dni, setDni] = useState("");
  const [direccion, setDireccion] = useState(meta.direccionCliente);
  const [cups, setCups] = useState("");
  const [iban, setIban] = useState("");

  const [uploadKind, setUploadKind] = useState<UploadKind>("FACTURA");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const arr = Array.from(list);

    // límite razonable
    const maxFiles = 10;
    const next = [...files, ...arr].slice(0, maxFiles);

    setFiles(next);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) return alert("Falta el nombre.");
    if (!telefono.trim()) return alert("Falta el teléfono.");
    if (!direccion.trim()) return alert("Falta la dirección.");
    if (!files.length) return alert("Sube al menos 1 documento (factura o DNI).");

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

      // metadata
      fd.append("ofertaId", meta.ofertaId);
      fd.append("compania", meta.compania);
      fd.append("tarifa", meta.tarifa);
      fd.append("agenteId", meta.agenteId);
      fd.append("lugarId", meta.lugarId);
      fd.append("tipoCliente", meta.tipoCliente);
      fd.append("nombreTarifa", meta.nombreTarifa);

      // tipo de docs (para etiquetar)
      fd.append("uploadKind", uploadKind);

      // archivos
      files.forEach((f) => fd.append("files", f, f.name));

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
      router.push(`/bienvenida?agenteId=${encodeURIComponent(meta.agenteId)}&lugarId=${encodeURIComponent(meta.lugarId)}&nombre=${encodeURIComponent(nombre)}`);
    } catch (err) {
      console.error(err);
      alert("Error enviando la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-4 py-6 md:px-10 md:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
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
                <p className="text-[11px] tracking-[0.25em] uppercase text-emerald-300 font-semibold">
                  Contratación
                </p>
                <h1 className="text-2xl md:text-3xl font-extrabold">
                  Toma de datos y documentación
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  {meta.compania ? <span className="font-semibold text-emerald-200">{meta.compania}</span> : null}
                  {meta.tarifa ? <span className="text-slate-300"> · {meta.tarifa}</span> : null}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-50 text-sm font-semibold"
            >
              ⬅ Volver
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={submit}
          className="rounded-3xl bg-slate-950/90 border border-slate-800 p-5 md:p-6 shadow-[0_0_28px_rgba(15,23,42,0.9)] space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre *">
              <input className="inp" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </Field>
            <Field label="Apellidos">
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
                <h2 className="text-lg md:text-xl font-extrabold text-emerald-200">
                  Documentación
                </h2>
                <p className="text-sm text-slate-300">
                  Sube factura y/o DNI. En móvil puedes hacer foto directamente.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-50 text-sm font-semibold"
                  value={uploadKind}
                  onChange={(e) => setUploadKind(e.target.value as UploadKind)}
                >
                  <option value="FACTURA">Factura</option>
                  <option value="DNI">DNI</option>
                  <option value="OTRO">Otro</option>
                </select>

                <input
                  ref={inputFilesRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <input
                  ref={inputCameraRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => addFiles(e.target.files)}
                />

                <button
                  type="button"
                  onClick={() => inputFilesRef.current?.click()}
                  className="px-3 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-sm font-semibold"
                >
                  📎 Subir archivos
                </button>
                <button
                  type="button"
                  onClick={() => inputCameraRef.current?.click()}
                  className="px-3 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-extrabold"
                >
                  📸 Hacer foto
                </button>
              </div>
            </div>

            {files.length === 0 ? (
              <div className="text-sm text-slate-400">
                Aún no has añadido documentos.
              </div>
            ) : (
              <ul className="space-y-2">
                {files.map((f, idx) => (
                  <li key={`${f.name}-${idx}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2">
                    <div className="text-sm">
                      <span className="font-semibold text-slate-100">{f.name}</span>{" "}
                      <span className="text-slate-400">({Math.round(f.size / 1024)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
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
              className="px-6 py-3 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm md:text-base font-extrabold shadow-[0_0_24px_rgba(16,185,129,0.55)] disabled:opacity-60"
            >
              {loading ? "Enviando…" : "Enviar solicitud"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .inp {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border-radius: 0.9rem;
          background: rgba(2, 6, 23, 0.75);
          border: 1px solid rgba(51, 65, 85, 1);
          color: #fff;
          outline: none;
          font-weight: 600;
        }
        .inp:focus {
          box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.55);
          border-color: rgba(52, 211, 153, 0.8);
        }
      `}</style>
    </div>
  );
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
      <label className="block text-sm font-extrabold text-slate-200 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
