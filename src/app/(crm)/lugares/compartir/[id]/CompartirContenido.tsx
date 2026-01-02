"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// Convierte un SVG (del QR) a PNG descargable
async function downloadSvgAsPng(
  svgEl: SVGSVGElement,
  filename: string,
  size = 1024
) {
  const serializer = new XMLSerializer();
  let svgText = serializer.serializeToString(svgEl);

  // Asegurar namespace
  if (!svgText.includes("http://www.w3.org/2000/svg")) {
    svgText = svgText.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new window.Image();
  img.crossOrigin = "anonymous";
  img.src = url;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se pudo convertir el QR a imagen."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible.");

  // Fondo blanco
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Dibujar
  ctx.drawImage(img, 0, 0, size, size);

  URL.revokeObjectURL(url);

  const pngUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = pngUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function CompartirContenido({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";

  // Tenant mode solo para SUPERADMIN con ?adminId=
  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;
  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const adminQuery =
    isSuperadmin && tenantMode && adminIdContext ? `?adminId=${adminIdContext}` : "";

  const withTenant = (href: string) => {
    if (!tenantMode || !adminIdContext) return href;
    if (!href.startsWith("/")) return href;
    const hasQuery = href.includes("?");
    return `${href}${hasQuery ? "&" : "?"}adminId=${adminIdContext}`;
  };

  const [loading, setLoading] = useState(true);
  const [lugar, setLugar] = useState<any>(null);
  const [agente, setAgente] = useState<any>(null);

  // Texto de WhatsApp editable (por defecto inteligente)
  const [mensaje, setMensaje] = useState("");

  // Para “copiado”
  const [copied, setCopied] = useState(false);

  // Ref del SVG del QR
  const qrWrapRef = useRef<HTMLDivElement | null>(null);

  // Seguridad mínima UX
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    (async () => {
      try {
        setLoading(true);

        // Reutilizamos tu endpoint de detalle (ya existe)
        const res = await fetch(`/api/lugares/${id}/detalle${adminQuery}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `No se pudo cargar el lugar (${res.status})`);
        }

        const data = await res.json();

        // Tu endpoint puede devolver { lugar, kpis... } o algo similar:
        const l = data?.lugar ?? data ?? null;
        setLugar(l);
        setAgente(l?.agente ?? data?.agente ?? null);

        // Mensaje base “bonito” (usa especialMensaje si existe)
        const nombreLugar = l?.nombre ? String(l.nombre) : "este lugar";
        const gancho =
          l?.especial && l?.especialMensaje
            ? String(l.especialMensaje)
            : "Ahorra en tu factura y gana ventajas";

        // El link final se calcula en useMemo, aquí dejamos plantilla
        setMensaje(
          `⚡ ${gancho}\n\n📍 ${nombreLugar}\n✅ Regístrate aquí y te ayudamos en 1 minuto:\n{LINK}\n\n— Impulso Energético`
        );
      } catch (e) {
        console.error(e);
        setLugar(null);
        setAgente(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, id, adminQuery]);

  // Link rastreable (público) — base para toda la trazabilidad
  const publicLink = useMemo(() => {
    const lugarId = lugar?.id ? Number(lugar.id) : Number(id);
    const agenteId = lugar?.agenteId ?? agente?.id;

    // Reforzamos trazabilidad con qrCode si existe
    const qr = lugar?.qrCode ? String(lugar.qrCode) : "";

    const params = new URLSearchParams();
    if (agenteId) params.set("agenteId", String(agenteId));
    if (lugarId) params.set("lugarId", String(lugarId));
    if (qr) params.set("qr", qr);

    return `/registro?${params.toString()}`;
  }, [lugar, agente, id]);

  const absolutePublicLink = useMemo(() => {
    return `https://impulsoenergetico.es${publicLink}`;
  }, [publicLink]);

  const whatsappLink = useMemo(() => {
    const text = mensaje.replace("{LINK}", absolutePublicLink);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [mensaje, absolutePublicLink]);

  const canNativeShare = useMemo(() => {
    return typeof navigator !== "undefined" && !!(navigator as any).share;
  }, []);

  const copyToClipboard = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const onShare = async () => {
    const shareText = mensaje.replace("{LINK}", absolutePublicLink);
    if (canNativeShare) {
      try {
        await (navigator as any).share({
          title: "Impulso Energético",
          text: shareText,
          url: absolutePublicLink,
        });
      } catch {
        // si cancela, no hacemos nada
      }
    } else {
      await copyToClipboard(absolutePublicLink);
      alert("Tu dispositivo no soporta compartir nativo. Enlace copiado.");
    }
  };

  const downloadQrPng = async () => {
    try {
      const svg = qrWrapRef.current?.querySelector("svg") as SVGSVGElement | null;
      if (!svg) return alert("No se encontró el QR para descargar.");

      const nombreLugar = lugar?.nombre ? String(lugar.nombre) : `lugar-${id}`;
      const safe = nombreLugar.replace(/[^\w\d-_]+/g, "-").toLowerCase();
      await downloadSvgAsPng(svg, `QR-${safe}.png`, 1024);
    } catch (e: any) {
      alert(e?.message || "No se pudo descargar el QR.");
    }
  };

  if (status === "loading" || (status === "authenticated" && !session)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50 px-6 md:px-8 py-8">
      <div className="w-full max-w-[1700px] mx-auto space-y-8 text-[15px] md:text-[16px] font-semibold">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-6 md:px-8 py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <Image
                src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                alt="Impulso Energético"
                width={150}
                height={44}
                className="hidden md:block"
              />
              <div className="min-w-0">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">
                  Kit de Compartir (Digital)
                </h1>
                <p className="text-sm md:text-base text-slate-300 font-semibold">
                  Comparte el enlace por WhatsApp, redes o email manteniendo la trazabilidad del
                  lugar.
                </p>
                {tenantMode && (
                  <p className="text-xs md:text-sm text-emerald-300 mt-1 font-bold">
                    Modo tenant · admin #{adminIdContext}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => router.push(withTenant("/lugares"))}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold px-5 h-10"
              >
                ← Volver
              </Button>
              <Button
                onClick={() => window.open(publicLink, "_blank")}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 h-10"
              >
                Abrir Landing
              </Button>
            </div>
          </div>
        </header>

        {/* INFO LUGAR */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6">
          {loading ? (
            <div className="text-slate-300">Cargando lugar…</div>
          ) : !lugar ? (
            <div className="text-red-300 font-extrabold">
              No se pudo cargar el lugar. Revisa permisos o ID.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="min-w-0">
                  <div className="text-sm text-slate-400 font-extrabold">Lugar</div>
                  <div className="text-2xl font-extrabold text-white break-words">
                    #{lugar.id} · {lugar.nombre}
                  </div>
                  <div className="text-sm text-slate-300 mt-1 font-semibold break-words">
                    {lugar.direccion || "—"}
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                        Agente asignado
                      </div>
                      <div className="mt-2 text-base font-extrabold text-white">
                        {lugar.agente?.nombre || agente?.nombre || "—"}
                      </div>
                      <div className="text-xs text-slate-400 font-semibold mt-1">
                        {lugar.agente?.email || agente?.email || ""}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                        Estado
                      </div>
                      <div className="mt-2">
                        <span
                          className={classNames(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border",
                            lugar.especial
                              ? "bg-pink-500/15 text-pink-200 border-pink-500/40"
                              : "bg-slate-700/30 text-slate-200 border-slate-500/40"
                          )}
                        >
                          {lugar.especial ? "⭐ Especial" : "Normal"}
                        </span>
                      </div>
                      {lugar.especial && (
                        <div className="text-xs text-slate-400 mt-2 font-semibold">
                          Gancho:{" "}
                          <span className="text-slate-200 font-extrabold">
                            {lugar.especialMensaje || "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logos para marketing (Impulso + Lugar especial) */}
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="text-sm font-extrabold text-slate-200">
                        Logos (para creatividades)
                        <div className="text-[11px] text-slate-400 font-semibold mt-1">
                          En Fase 2 estos logos se insertan automáticamente en post/story/email.
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
                          <Image
                            src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                            alt="Impulso Energético"
                            width={150}
                            height={44}
                            className="h-9 w-auto object-contain"
                          />
                        </div>

                        {lugar.especial && !!lugar.especialLogoUrl && (
                          <div className="rounded-xl border border-slate-800 bg-white px-3 py-2">
                            <Image
                              src={String(lugar.especialLogoUrl)}
                              alt="Logo del lugar"
                              width={90}
                              height={90}
                              className="h-10 w-10 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR + acciones rápidas */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5 w-full lg:w-[380px]">
                  <div className="text-sm font-extrabold text-slate-200 mb-3">
                    QR Digital (para compartir)
                  </div>

                  <div
                    ref={qrWrapRef}
                    className="rounded-2xl border border-slate-800 bg-white p-4 flex items-center justify-center"
                  >
                    <QRCode value={absolutePublicLink} size={220} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={downloadQrPng}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold h-10"
                    >
                      Descargar PNG
                    </Button>
                    <Button
                      type="button"
                      onClick={() => copyToClipboard(absolutePublicLink)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-10"
                    >
                      {copied ? "✅ Copiado" : "Copiar enlace"}
                    </Button>
                  </div>

                  <div className="mt-2">
                    <Button
                      type="button"
                      onClick={onShare}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-10"
                    >
                      {canNativeShare ? "📲 Compartir (móvil)" : "📲 Compartir / Copiar"}
                    </Button>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3 font-semibold">
                    Este QR apunta al enlace rastreable del lugar (toda la atribución queda guardada
                    por agente y lugar).
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ENLACE + WHATSAPP */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6 space-y-5">
          <h2 className="text-xl font-extrabold">Enlace rastreable</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <label className="text-xs text-slate-300 font-extrabold">
                Enlace (para estado de WhatsApp, bio, email, redes)
              </label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <Input
                  value={absolutePublicLink}
                  readOnly
                  className="bg-slate-900 border-slate-700 text-slate-100 h-11 font-semibold"
                />
                <Button
                  onClick={() => copyToClipboard(absolutePublicLink)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-11 px-6"
                >
                  {copied ? "✅ Copiado" : "Copiar"}
                </Button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-semibold">
                Consejo: pégalo en el estado, en un mensaje o en la bio. Mantiene trazabilidad por
                lugar y agente.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
              <div className="text-sm font-extrabold text-slate-200">Acceso rápido</div>
              <div className="mt-3 grid gap-2">
                <Button
                  onClick={() => window.open(whatsappLink, "_blank")}
                  className="bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold h-10"
                >
                  WhatsApp (mensaje listo)
                </Button>

                <Button
                  onClick={onShare}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold h-10"
                >
                  Compartir
                </Button>

                <Button
                  onClick={() => window.open(publicLink, "_blank")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold h-10"
                >
                  Abrir Landing
                </Button>
              </div>
            </div>
          </div>

          {/* TEXTO + PREVIEW MAQUETADO */}
          <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-200">
                Texto con gancho (WhatsApp / Email)
              </h3>
              <Button
                type="button"
                onClick={() => copyToClipboard(mensaje.replace("{LINK}", absolutePublicLink))}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-9 px-4"
              >
                Copiar texto
              </Button>
            </div>

            <div className="mt-3">
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={6}
                className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 p-4 text-slate-100 font-semibold text-sm outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-2 font-semibold">
                Usa <span className="font-mono text-slate-200">{`{LINK}`}</span> para insertar el
                enlace automáticamente.
              </p>
            </div>

            {/* PREVIEW MAQUETADO (base Fase 2) */}
            {!loading && !!lugar && (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-sm font-extrabold text-slate-200">
                      Previsualización (para WhatsApp / Email)
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold mt-1">
                      En Fase 2 podrás adjuntar imagen/vídeo y descargarlo como creatividad.
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      copyToClipboard(mensaje.replace("{LINK}", absolutePublicLink))
                    }
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-9 px-4"
                  >
                    Copiar texto final
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-start">
                  {/* Mensaje maquetado */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    {/* Cabecera con logos */}
                    <div className="flex items-center justify-between gap-3">
                      <Image
                        src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                        alt="Impulso Energético"
                        width={140}
                        height={40}
                        className="h-8 w-auto object-contain opacity-95"
                      />

                      {lugar?.especial && lugar?.especialLogoUrl ? (
                        <div className="rounded-xl bg-white border border-slate-800 px-2 py-1">
                          <Image
                            src={String(lugar.especialLogoUrl)}
                            alt="Logo lugar"
                            width={48}
                            height={48}
                            className="h-8 w-8 object-contain"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 whitespace-pre-wrap text-sm text-slate-100 font-semibold leading-relaxed">
                      {mensaje.replace("{LINK}", absolutePublicLink)}
                    </div>

                    <div className="mt-3 text-[11px] text-slate-400 font-semibold">
                      Consejo: listo para copiar/pegar en WhatsApp, email o redes.
                    </div>
                  </div>

                  {/* QR + link pequeño */}
                  <div className="rounded-2xl border border-slate-800 bg-white p-3">
                    <div className="text-[11px] text-slate-700 font-extrabold mb-2">
                      QR + Enlace
                    </div>
                    <div className="flex items-center justify-center">
                      <QRCode value={absolutePublicLink} size={170} />
                    </div>
                    <div className="mt-2 text-[10px] break-all text-slate-700 font-semibold">
                      {absolutePublicLink}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PREPARADO PARA MARKETING (FASE 2/3) */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-8 py-6">
          <h2 className="text-xl font-extrabold">Marketing (próximo)</h2>
          <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/30 p-5 space-y-2">
            <p className="text-slate-300 font-semibold">
              Aquí iremos añadiendo (por partes) lo que me has pedido:
            </p>
            <ul className="list-disc pl-5 text-slate-300 text-sm font-semibold space-y-1">
              <li>Subir imágenes y vídeos por lugar (para campañas y redes)</li>
              <li>Plantillas de textos por rol (admin/agente) y por tipo (normal/especial)</li>
              <li>Descargar creatividades listas: post (1080x1080) y story (1080x1920)</li>
              <li>Compartir por Email con plantilla y adjunto</li>
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                disabled
                className="bg-slate-800 text-slate-400 font-extrabold h-10 cursor-not-allowed"
                title="Lo activamos en la Fase 2"
              >
                ⬆️ Subir imagen/vídeo (Fase 2)
              </Button>

              <Button
                type="button"
                disabled
                className="bg-slate-800 text-slate-400 font-extrabold h-10 cursor-not-allowed"
                title="Lo activamos en la Fase 2"
              >
                🎨 Generar post/story (Fase 2)
              </Button>

              <Button
                type="button"
                disabled
                className="bg-slate-800 text-slate-400 font-extrabold h-10 cursor-not-allowed"
                title="Lo activamos en la Fase 3"
              >
                ✉️ Email con plantilla (Fase 3)
              </Button>
            </div>

            {(isAdmin || isSuperadmin) && (
              <p className="text-[11px] text-emerald-300 mt-3 font-bold">
                Nota: las campañas las dejaremos controladas por roles (ADMIN/SUPERADMIN) para que
                el agente solo use lo aprobado.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
