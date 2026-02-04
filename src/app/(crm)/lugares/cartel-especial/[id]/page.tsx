"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import * as QRCodeLib from "qrcode";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

const EMAIL_FIJO = "info@impulsoenergetico.es";
const WEB = "www.impulsoenergetico.es";
const TELEFONO_FIJO = "692 137 048";

const IMPULSO_LOGO_SRC =
  "/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png";

// ✅ evita que res.json() reviente si el backend devuelve HTML o texto
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw: text?.slice(0, 300) };
  }
}

async function waitImages(el: HTMLElement) {
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          const im = img as HTMLImageElement;
          if (im.complete && im.naturalWidth > 0) return resolve();
          const done = () => resolve();
          im.addEventListener("load", done, { once: true });
          im.addEventListener("error", done, { once: true });
        })
    )
  );
}

export default function CartelLugarEspecial() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";

  // tenant solo para obtener lugar
  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;

  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const adminQuery = tenantMode && adminIdContext ? `?adminId=${adminIdContext}` : "";

  const id = params?.id as string | undefined;

  const [lugar, setLugar] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [exportando, setExportando] = useState(false);
  const cartelRef = useRef<HTMLDivElement>(null);

  // ✅ DataURL para evitar CORS/tainted canvas en PDF
  const [fondoDataUrl, setFondoDataUrl] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  // ✅ QR en PNG (dataURL) para evitar SVG (react-qr-code rompe html2pdf)
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // QR real del lugar
  const qrUrl = useMemo(() => {
    if (!lugar) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;
  }, [lugar]);

  const agenteTelefono = useMemo(() => {
    const t = String(lugar?.agente?.telefono ?? "").trim();
    return t || TELEFONO_FIJO;
  }, [lugar]);

  const agenteEmail = useMemo(() => {
    const e = String(lugar?.agente?.email ?? "").trim();
    return e || EMAIL_FIJO;
  }, [lugar]);

  // ✅ Fondo especial del lugar (URL)
  const fondoUrl = useMemo(() => {
    const u = String(lugar?.especialCartelUrl ?? "").trim();
    return u || null;
  }, [lugar]);

  // ✅ Escudo/logo club SOLO en especial (URL)
  const logoClubUrl = useMemo(() => {
    const u = String(lugar?.especialLogoUrl ?? "").trim();
    return u || null;
  }, [lugar]);

  useEffect(() => {
    if (!id) return;

    let alive = true;

    const fetchLugar = async () => {
      const res = await fetch(`/api/lugares/${id}${adminQuery}`, { cache: "no-store" });
      const out = await safeJson(res);
      if (!out.ok) {
        const msg =
          (out.data && (out.data.error || out.data.message)) ||
          out.raw ||
          `Error HTTP ${out.status}`;
        throw new Error(msg);
      }
      return out.data;
    };

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setFondoDataUrl(null);
        setLogoDataUrl(null);
        setQrDataUrl("");

        const data = await fetchLugar();
        if (!alive) return;
        setLugar(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Error cargando datos del cartel especial");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, adminQuery]);

  // ✅ Preparar QR como PNG
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!qrUrl) return;

        // Tipado explícito para que TS no marque rojo
        const toDataURL = (QRCodeLib as any).toDataURL as (
          text: string,
          opts?: any
        ) => Promise<string>;

        const png = await toDataURL(qrUrl, {
          margin: 1,
          width: 512,
          errorCorrectionLevel: "M",
        });

        if (alive) setQrDataUrl(png);
      } catch (e) {
        console.warn("No se pudo generar QR PNG:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [qrUrl]);

  // ✅ Preparar fondo/escudo como DataURL para PDF
  useEffect(() => {
    let alive = true;

    async function toDataUrl(url: string) {
      const r = await fetch(`/api/utils/image-dataurl?url=${encodeURIComponent(url)}`, {
        cache: "no-store",
      });
      const out = await safeJson(r);
      if (!out.ok) throw new Error(out.data?.error || out.raw || "Error preparando imagen");
      return out.data?.dataUrl as string;
    }

    (async () => {
      try {
        if (fondoUrl) {
          const d = await toDataUrl(fondoUrl);
          if (alive) setFondoDataUrl(d);
        }
        if (logoClubUrl) {
          const d2 = await toDataUrl(logoClubUrl);
          if (alive) setLogoDataUrl(d2);
        }
      } catch (e) {
        console.warn("No se pudo preparar fondo/escudo para PDF:", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [fondoUrl, logoClubUrl]);

  const cleanupHtml2PdfOverlays = () => {
    try {
      document
        .querySelectorAll(".html2pdf__overlay, .html2pdf__container")
        .forEach((el) => el.remove());

      document.querySelectorAll("iframe").forEach((el) => {
        const src = el.getAttribute("src");
        if (!src || src === "about:blank") el.remove();
      });

      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
    } catch {}
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 800);
  };

  const imprimirCartel = async () => {
    if (!cartelRef.current || !lugar) return;

    const contenido = cartelRef.current.outerHTML;

    const ventana = window.open("", "", "width=900,height=1000");
    if (!ventana) return;

    ventana.document.open();
    ventana.document.write(`
      <html>
        <head>
          <title>Imprimir Cartel Especial</title>
          <style>
            @page { size: A4; margin: 0; }
            html, body { margin: 0; padding: 0; background: #fff; }
            * { box-sizing: border-box; }
            img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>
          ${contenido}
          <script>
            window.onload = () => {
              window.focus();
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  // ✅ Descargar PDF (estable)
  // ✅ Descargar PDF (estable + sin OKLCH)
  const descargarPDF = async () => {
    if (!cartelRef.current || !lugar) return;

    try {
      setExportando(true);
      cleanupHtml2PdfOverlays();

      // ✅ espera a que carguen todas las imágenes + fuentes
      await waitImages(cartelRef.current);
      // @ts-ignore
      await (document as any).fonts?.ready?.catch?.(() => {});

      const html2pdf = (await import("html2pdf.js")).default;

      // fuerza reflow
      cartelRef.current.getBoundingClientRect();

      // @ts-ignore
      const worker = html2pdf()
        .set({
          margin: 0,
          filename: `cartel_especial_${lugar.id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,

            // ✅ CLAVE: evitamos que html2canvas lea Tailwind/shadcn con OKLCH
            onclone: (doc: Document) => {
              // Quitamos CSS global (donde vienen los oklch())
              doc.querySelectorAll("style, link[rel='stylesheet']").forEach((n) => n.remove());

              // Forzamos un entorno neutro
              const html = doc.documentElement as HTMLElement;
              const body = doc.body as HTMLBodyElement;

              html.style.background = "#fff";
              body.style.background = "#fff";
              body.style.color = "#000";
            },
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(cartelRef.current);

      // ✅ forma robusta
      // @ts-ignore
      const pdfBlob: Blob = await worker.toPdf().output("blob");

      if (!pdfBlob) throw new Error("No se pudo generar el PDF (html2pdf falló).");

      downloadBlob(pdfBlob, `cartel_especial_${lugar.id}.pdf`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error generando PDF del cartel especial");
    } finally {
      cleanupHtml2PdfOverlays();
      setExportando(false);
    }
  };


  if (loading) return <div className="p-10 text-center">Cargando cartel...</div>;

  if (error) {
    return (
      <div className="p-10 text-center">
        <div className="font-extrabold text-red-700 mb-2">
          Error cargando el cartel especial
        </div>
        <pre className="text-left mx-auto max-w-2xl whitespace-pre-wrap bg-red-50 border border-red-200 p-4 rounded-lg text-sm">
          {error}
        </pre>
        <div className="mt-4">
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    );
  }

  if (!lugar) {
    return (
      <div className="p-10 text-center">
        No se pudo cargar el lugar.
        <div className="mt-4">
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    );
  }

  if (!fondoUrl) {
    return (
      <div className="p-10 text-center">
        Este lugar no tiene <b>cartel especial</b> configurado.
        <div className="mt-3 text-sm text-gray-600">
          Asigna <b>especialCartelUrl</b> en la edición del lugar.
        </div>
        <div className="mt-4">
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    );
  }

  const volverLugaresHref = tenantMode ? `/lugares?adminId=${adminIdContext}` : "/lugares";

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-6">
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(volverLugaresHref)}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            📍 Volver a Lugares
          </Button>

          <Button
            onClick={() => router.back()}
            className="bg-gray-200 text-black hover:bg-gray-300"
          >
            ⬅ Volver
          </Button>
        </div>

        <div className="text-xs md:text-sm font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg">
          Cartel Especial (fondo del lugar + escudo)
        </div>
      </div>

      {/* CARTEL A4 ESPECIAL */}
      <div
        ref={cartelRef}
        style={{
          width: "210mm",
          height: "297mm",
          position: "relative",
          overflow: "hidden",
          background: "#ffffff",
          border: "1px solid #d1d5db",
          boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
        }}
      >
        {/* Fondo especial */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fondoDataUrl ?? fondoUrl}
          alt="Fondo especial del cartel"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        {/* RECUADRO BLANCO INFERIOR */}
        <div
          style={{
            position: "absolute",
            left: "12mm",
            right: "12mm",
            bottom: "12mm",
            height: "54mm",
            background: "#ffffff",
            borderRadius: "9mm",
            border: "2.5px solid #C9A227",
            boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6mm",
            gap: "6mm",
            zIndex: 5,
          }}
        >
          {/* QR (PNG) */}
          <div
            style={{
              width: "42mm",
              height: "42mm",
              background: "#fff",
              borderRadius: "6mm",
              border: "2px solid #111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3mm",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#fff" }} />
            )}
          </div>

          {/* Centro */}
          <div style={{ flex: 1, textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMPULSO_LOGO_SRC}
              alt="Impulso Energético"
              style={{
                height: "16mm",
                margin: "0 auto 4mm auto",
                objectFit: "contain",
              }}
            />

            <div
              style={{
                fontSize: "12pt",
                fontWeight: 800,
                letterSpacing: "0.6pt",
                color: "#111827",
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              {(lugar?.agente?.nombre ?? "AGENTE IMPULSO").toString()}
            </div>

            <div
              style={{
                marginTop: "2.5mm",
                fontSize: "9.4pt",
                fontWeight: 700,
                color: "#374151",
              }}
            >
              <span style={{ fontWeight: 900 }}>
                {agenteEmail} · {agenteTelefono}
              </span>
              <span> · {WEB}</span>
            </div>
          </div>

          {/* Escudo */}
          <div style={{ width: "28mm", height: "28mm", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoClubUrl ? (
              <img
                src={logoDataUrl ?? logoClubUrl}
                alt="Escudo / Logo del lugar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4 justify-center flex-wrap">
        <Button
          onClick={descargarPDF}
          disabled={exportando}
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {exportando ? "Generando PDF..." : "Descargar cartel especial en PDF"}
        </Button>

        <Button
          onClick={imprimirCartel}
          disabled={exportando}
          className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          Imprimir cartel especial
        </Button>
      </div>
    </div>
  );
}
