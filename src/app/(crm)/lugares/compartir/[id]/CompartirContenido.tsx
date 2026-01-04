"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MarketingAssetsPanel from "./MarketingAssetsPanel";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// Convierte un SVG (del QR) a PNG descargable
async function downloadSvgAsPng(svgEl: SVGSVGElement, filename: string, size = 1024) {
  const serializer = new XMLSerializer();
  let svgText = serializer.serializeToString(svgEl);

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

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
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

function safeFilename(name: string) {
  return name.replace(/[^\w\d-_]+/g, "-").toLowerCase();
}

export default function CompartirContenido({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";
  const isAdmin = role === "ADMIN";
  const canMarketingManage = isAdmin || isSuperadmin;

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

  const [mensaje, setMensaje] = useState("");
  const [copied, setCopied] = useState(false);
  const qrWrapRef = useRef<HTMLDivElement | null>(null);

  // Seguridad mínima UX
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Cargar lugar
  useEffect(() => {
    if (!session) return;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/lugares/${id}/detalle${adminQuery}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || `No se pudo cargar el lugar (${res.status})`);
        }

        const data = await res.json();
        const l = data?.lugar ?? data ?? null;

        setLugar(l);
        setAgente(l?.agente ?? data?.agente ?? null);

        const nombreLugar = l?.nombre ? String(l.nombre) : "este lugar";
        const gancho =
          l?.especial && l?.especialMensaje
            ? String(l.especialMensaje)
            : "Ahorra en tu factura y gana ventajas";

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

  // Link rastreable (público)
  const publicLink = useMemo(() => {
    const lugarId = lugar?.id ? Number(lugar.id) : Number(id);
    const agenteId = lugar?.agenteId ?? agente?.id;
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
        // cancelado
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
      await downloadSvgAsPng(svg, `QR-${safeFilename(nombreLugar)}.png`, 1024);
    } catch (e: any) {
      alert(e?.message || "No se pudo descargar el QR.");
    }
  };

  if (status === "loading" || (status === "authenticated" && !session)) return null;

  const mensajeFinal = mensaje.replace("{LINK}", absolutePublicLink);

  const impulsoLogoSrc =
    "/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png";
  const especialLogoUrl: string | null =
    lugar?.especial && lugar?.especialLogoUrl ? String(lugar.especialLogoUrl) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50 px-6 md:px-8 py-8">
      <div className="w-full max-w-[1700px] mx-auto space-y-8 text-[16px] md:text-[18px] font-bold">
        {/* CABECERA */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-emerald-500/20 via-sky-500/15 to-fuchsia-500/20 p-[1px] shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="rounded-3xl bg-slate-950/95 px-6 md:px-10 py-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-5">
              <Image
                src={impulsoLogoSrc}
                alt="Impulso Energético"
                width={220}
                height={70}
                className="hidden md:block"
                priority
              />
              <div className="min-w-0">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">
                  Kit de Compartir (Digital)
                </h1>
                <p className="text-base md:text-lg text-slate-300 font-bold">
                  Comparte por WhatsApp, redes o email manteniendo la trazabilidad del lugar.
                </p>
                {tenantMode && (
                  <p className="text-sm md:text-base text-emerald-300 mt-2 font-extrabold">
                    Modo tenant · admin #{adminIdContext}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => router.push(withTenant("/lugares"))}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold px-6 h-11 text-base"
              >
                ← Volver
              </Button>
              <Button
                onClick={() => window.open(publicLink, "_blank")}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 h-11 text-base"
              >
                Abrir Landing
              </Button>
            </div>
          </div>
        </header>

        {/* INFO LUGAR */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-10 py-8">
          {loading ? (
            <div className="text-slate-300 font-extrabold">Cargando lugar…</div>
          ) : !lugar ? (
            <div className="text-red-300 font-extrabold">
              No se pudo cargar el lugar. Revisa permisos o ID.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-slate-400 font-extrabold">Lugar</div>
                  <div className="text-3xl md:text-4xl font-extrabold text-white break-words mt-1">
                    #{lugar.id} · {lugar.nombre}
                  </div>
                  <div className="text-base text-slate-300 mt-2 font-bold break-words">
                    {lugar.direccion || "—"}
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                      <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                        Agente asignado
                      </div>
                      <div className="mt-3 text-xl font-extrabold text-white">
                        {lugar.agente?.nombre || agente?.nombre || "—"}
                      </div>
                      <div className="text-sm text-slate-400 font-bold mt-1">
                        {lugar.agente?.email || agente?.email || ""}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                      <div className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                        Estado
                      </div>
                      <div className="mt-3">
                        <span
                          className={classNames(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-extrabold border",
                            lugar.especial
                              ? "bg-pink-500/15 text-pink-200 border-pink-500/40"
                              : "bg-slate-700/30 text-slate-200 border-slate-500/40"
                          )}
                        >
                          {lugar.especial ? "⭐ Especial" : "Normal"}
                        </span>
                      </div>
                      {lugar.especial && (
                        <div className="text-sm text-slate-300 mt-3 font-bold">
                          Gancho:{" "}
                          <span className="text-white font-extrabold">
                            {lugar.especialMensaje || "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logos */}
                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="text-lg font-extrabold text-slate-100">
                          Logos (para creatividades)
                        </div>
                        <div className="text-sm text-slate-400 font-bold mt-1">
                          Aquí deben verse SIEMPRE el logo de Impulso y, si es especial, el del lugar.
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
                          <Image
                            src={impulsoLogoSrc}
                            alt="Impulso Energético"
                            width={240}
                            height={80}
                            className="h-12 w-auto object-contain"
                            priority
                          />
                        </div>

                        {lugar.especial ? (
                          especialLogoUrl ? (
                            <div className="rounded-2xl border border-slate-800 bg-white px-4 py-3">
                              <img
                                src={especialLogoUrl}
                                alt="Logo del lugar"
                                className="h-12 w-auto object-contain"
                              />
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-300 font-extrabold text-sm">
                              Falta especialLogoUrl
                            </div>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR + acciones */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 w-full lg:w-[420px]">
                  <div className="text-lg font-extrabold text-slate-200 mb-4">
                    QR Digital (para compartir)
                  </div>

                  <div
                    ref={qrWrapRef}
                    className="rounded-2xl border border-slate-800 bg-white p-5 flex items-center justify-center"
                  >
                    <QRCode value={absolutePublicLink} size={240} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={downloadQrPng}
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold h-11 text-base"
                    >
                      Descargar PNG
                    </Button>
                    <Button
                      type="button"
                      onClick={() => copyToClipboard(absolutePublicLink)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-11 text-base"
                    >
                      {copied ? "✅ Copiado" : "Copiar enlace"}
                    </Button>
                  </div>

                  <div className="mt-2">
                    <Button
                      type="button"
                      onClick={onShare}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold h-11 text-base"
                    >
                      {canNativeShare ? "📲 Compartir (móvil)" : "📲 Compartir / Copiar"}
                    </Button>
                  </div>

                  <p className="text-sm text-slate-400 mt-4 font-bold">
                    Este QR apunta al enlace rastreable del lugar (atribución por agente y lugar).
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ENLACE + WHATSAPP */}
        <section className="rounded-3xl bg-slate-950/80 border border-slate-800 px-6 md:px-10 py-8 space-y-6">
          <h2 className="text-2xl md:text-3xl font-extrabold">Enlace rastreable</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <label className="text-sm text-slate-300 font-extrabold">
                Enlace (estado de WhatsApp, bio, email, redes)
              </label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <Input
                  value={absolutePublicLink}
                  readOnly
                  className="bg-slate-900 border-slate-700 text-slate-100 h-12 font-extrabold text-base"
                />
                <Button
                  onClick={() => copyToClipboard(absolutePublicLink)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-12 px-7 text-base"
                >
                  {copied ? "✅ Copiado" : "Copiar"}
                </Button>
              </div>
              <p className="text-sm text-slate-400 mt-2 font-bold">
                Consejo: pégalo en el estado o la bio. Mantiene trazabilidad por lugar y agente.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
              <div className="text-lg font-extrabold text-slate-200">Acceso rápido</div>
              <div className="mt-4 grid gap-2">
                <Button
                  onClick={() => window.open(whatsappLink, "_blank")}
                  className="bg-green-500 hover:bg-green-400 text-slate-950 font-extrabold h-11 text-base"
                >
                  WhatsApp (mensaje listo)
                </Button>

                <Button
                  onClick={onShare}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold h-11 text-base"
                >
                  Compartir
                </Button>

                <Button
                  onClick={() => window.open(publicLink, "_blank")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold h-11 text-base"
                >
                  Abrir Landing
                </Button>
              </div>
            </div>
          </div>

          {/* Texto */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-xl font-extrabold text-slate-100">
                Texto con gancho (WhatsApp / Email)
              </h3>
              <Button
                type="button"
                onClick={() => copyToClipboard(mensajeFinal)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-10 px-5 text-base"
              >
                Copiar texto
              </Button>
            </div>

            <div className="mt-4">
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={6}
                className="w-full rounded-2xl bg-slate-950/60 border border-slate-800 p-5 text-slate-100 font-extrabold text-base outline-none"
              />
              <p className="text-sm text-slate-400 mt-2 font-bold">
                Usa <span className="font-mono text-slate-200">{`{LINK}`}</span> para insertar el enlace automáticamente.
              </p>
            </div>
          </div>
        </section>

        {/* ✅ FASE 2 (AHORA EN COMPONENTE SEPARADO) */}
        {!loading && !!lugar?.id && (
            <MarketingAssetsPanel lugarId={Number(lugar.id)} />
        )}

      </div>
    </div>
  );
}
