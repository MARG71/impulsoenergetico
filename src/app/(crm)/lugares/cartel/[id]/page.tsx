"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

type Fondo = {
  id: number;
  nombre: string;
  url: string;
  activo?: boolean;
  creadoEn?: string;
};

const IMPULSO_LOGO_SRC =
  "/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png";

const TELEFONO_FIJO = "692 137 048";

// ✅ evita que res.json() reviente si el backend devuelve HTML o texto
async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) as any };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw: text?.slice(0, 300) as any };
  }
}

export default function CartelLugar() {
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
  const [fondoActivo, setFondoActivo] = useState<Fondo | null>(null);
  const fondoUrl = fondoActivo?.url ?? null;

  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Nuevo: convertimos el fondo a dataURL para evitar CORS-tainted canvas
  const [fondoDataUrl, setFondoDataUrl] = useState<string | null>(null);
  const [bgReady, setBgReady] = useState(false);

  const [exportando, setExportando] = useState(false);
  const cartelRef = useRef<HTMLDivElement>(null);

  const agenteTelefono = useMemo(() => {
    const t = String(lugar?.agente?.telefono ?? "").trim();
    return t || TELEFONO_FIJO;
  }, [lugar]);

  const agenteNombre = useMemo(() => {
    const n = String(lugar?.agente?.nombre ?? "").trim();
    return n || "Impulso Energético";
  }, [lugar]);

  // Link QR real del lugar
  const qrUrl = useMemo(() => {
    if (!lugar) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;
  }, [lugar]);

  // Fetch lugar + fondo activo
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

    const fetchFondoActivo = async () => {
      const res = await fetch(`/api/fondos?filtro=todos`, { cache: "no-store" });
      const out = await safeJson(res);
      if (!out.ok) {
        const msg =
          (out.data && (out.data.error || out.data.message)) ||
          out.raw ||
          `Error HTTP ${out.status}`;
        throw new Error(msg);
      }

      const data = out.data as Fondo[];

      if (!Array.isArray(data) || data.length === 0) {
        return {
          fondo: null as Fondo | null,
          warn: "No hay fondos subidos aún. Sube uno en /lugares/fondos.",
        };
      }

      const activo = data.find((f) => !!f.activo && !!f.url);
      if (activo) return { fondo: activo, warn: null };

      const primero = data.find((f) => !!f.url) ?? null;
      return {
        fondo: primero,
        warn: primero
          ? "No hay ningún fondo marcado como activo. Mostrando el más reciente. (Activa uno en /lugares/fondos)"
          : "No se pudo obtener URL de fondo.",
      };
    };

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [l, f] = await Promise.all([fetchLugar(), fetchFondoActivo()]);

        if (!alive) return;
        setLugar(l);
        setFondoActivo(f.fondo);
        setWarning(f.warn);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Error cargando datos del cartel");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, adminQuery]);

  // ✅ Convertir fondoUrl -> dataURL (evita CORS y html2pdf falla menos)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setBgReady(false);
        setFondoDataUrl(null);

        if (!fondoUrl) return;

        const r = await fetch(
          `/api/utils/image-dataurl?url=${encodeURIComponent(fondoUrl)}`,
          { cache: "no-store" }
        );
        const d = await r.json().catch(() => ({}));

        if (!alive) return;

        if (!r.ok || !d?.ok || !d?.dataUrl) {
          // fallback: dejamos fondoUrl directo (puede fallar PDF si CORS)
          setFondoDataUrl(null);
          return;
        }

        setFondoDataUrl(d.dataUrl);
      } catch {
        if (!alive) return;
        setFondoDataUrl(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [fondoUrl]);

  // Helpers
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

  const registrarHistorial = async (accion: "IMPRIMIR" | "DESCARGAR_PDF") => {
    try {
      const r = await fetch("/api/carteles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "A4_QR",
          accion,
          lugarId: lugar?.id,
          fondoId: fondoActivo?.id ?? null,
          fondoUrlSnap: fondoActivo?.url ?? null,
          qrUrlSnap: qrUrl,
          adminId: tenantMode ? adminIdContext : null,
        }),
      });

      const d = await r.json().catch(() => ({}));
      return d?.cartel?.id ?? null;
    } catch (e) {
      console.warn("No se pudo registrar historial:", e);
      return null;
    }
  };

  // Imprimir
  const imprimirCartel = async () => {
    if (!cartelRef.current || !lugar) return;

    await registrarHistorial("IMPRIMIR");

    const contenido = cartelRef.current.outerHTML;

    const ventana = window.open("", "", "width=900,height=1000");
    if (!ventana) return;

    ventana.document.open();
    ventana.document.write(`
      <html>
        <head>
          <title>Imprimir Cartel</title>
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

  async function waitForBgReady(timeoutMs = 5000) {
    const start = Date.now();
    while (!bgReady && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  // Descargar PDF (historial + Cloudinary)
  const descargarPDF = async () => {
    if (!cartelRef.current || !lugar) return;

    try {
      setExportando(true);
      cleanupHtml2PdfOverlays();

      // ✅ Espera a que el fondo esté cargado (evita capturar “en blanco”)
      await waitForBgReady(6000);

      const cartelId = await registrarHistorial("DESCARGAR_PDF");
      if (!cartelId) throw new Error("No se pudo crear el registro de historial (sin ID).");

      const html2pdf = (await import("html2pdf.js")).default;

      // @ts-ignore
      const worker = html2pdf()
        .from(cartelRef.current)
        .set({
          margin: 0,
          filename: `cartel_lugar_${lugar.id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2.5,
            useCORS: false, // ✅ ya tenemos dataURL, no hace falta CORS
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        });

      // ✅ Esto es lo que funciona bien en navegador
      // @ts-ignore
      const pdfBlob: Blob = await worker.output("blob");
      if (!pdfBlob) throw new Error("No se pudo generar el PDF (html2pdf falló).");

      // ✅ subimos a Cloudinary (raw)
      const file = new File([pdfBlob], `cartel_lugar_${lugar.id}.pdf`, {
        type: "application/pdf",
      });

      const form = new FormData();
      form.append("file", file);
      form.append("folder", "impulso/carteles-generados");
      form.append("resourceType", "raw");

      const rUp = await fetch("/api/uploads", { method: "POST", body: form });
      const dUp = await rUp.json().catch(() => ({}));
      if (!rUp.ok) throw new Error(dUp?.error || "Error subiendo PDF a Cloudinary");

      const rPatch = await fetch(`/api/carteles/${cartelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivoUrl: dUp.url,
          archivoPublicId: dUp.publicId ?? null,
          archivoResourceType: dUp.resourceType ?? "raw",
          archivoMime: dUp.mime ?? "application/pdf",
          archivoBytes: dUp.bytes ?? null,
          archivoFormat: dUp.format ?? "pdf",
        }),
      });

      const dPatch = await rPatch.json().catch(() => ({}));
      if (!rPatch.ok) throw new Error(dPatch?.error || "No se pudo asociar el PDF al historial");

      downloadBlob(pdfBlob, `cartel_lugar_${lugar.id}.pdf`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error generando/subiendo PDF");
    } finally {
      cleanupHtml2PdfOverlays();
      setExportando(false);
    }
  };

  // UI states
  if (loading) return <div className="p-10 text-center">Cargando cartel...</div>;

  if (error) {
    return (
      <div className="p-10 text-center">
        <div className="font-extrabold text-red-700 mb-2">Error cargando el cartel</div>
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
        No hay fondo disponible (o no se pudo cargar).
        <div className="mt-3 text-sm text-gray-600">
          Sube y activa un fondo en <b>/lugares/fondos</b>.
        </div>
        <div className="mt-4">
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    );
  }

  const historialHref = tenantMode
    ? `/lugares/${lugar.id}/historial-carteles?adminId=${adminIdContext}`
    : `/lugares/${lugar.id}/historial-carteles`;

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

          <Button
            onClick={() => router.push(historialHref)}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            🧾 Ver Historial
          </Button>
        </div>

        {warning ? (
          <div className="text-xs md:text-sm font-bold text-amber-700 bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg">
            {warning}
          </div>
        ) : null}
      </div>

      {/* CARTEL A4 */}
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
        {/* Fondo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fondoDataUrl ?? fondoUrl}
          alt="Fondo del cartel"
          onLoad={() => setBgReady(true)}
          onError={() => setBgReady(false)}
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
            height: "52mm",
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
          {/* QR */}
          <div
            style={{
              width: "45mm",
              height: "45mm",
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
            <QRCode value={qrUrl} size={145} />
          </div>

          {/* Centro: logo + nombre + línea contacto */}
          <div style={{ flex: 1, textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMPULSO_LOGO_SRC}
              alt="Impulso Energético"
              style={{
                height: "15mm",
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
              {agenteNombre}
            </div>

            <div
              style={{
                marginTop: "3mm",
                fontSize: "9.4pt",
                fontWeight: 800,
                color: "#374151",
              }}
            >
              <span style={{ fontWeight: 900 }}>
                {lugar?.agente?.email ?? "info@impulsoenergetico.es"} · {agenteTelefono}
              </span>
              <span> · www.impulsoenergetico.es</span>
            </div>
          </div>

          {/* derecha vacía */}
          <div style={{ width: "18mm", height: "18mm", flexShrink: 0 }} />
        </div>
      </div>

      <div className="mt-6 flex gap-4 justify-center flex-wrap">
        <Button
          onClick={descargarPDF}
          disabled={exportando}
          className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {exportando ? "Generando PDF..." : "Descargar cartel en PDF"}
        </Button>

        <Button
          onClick={imprimirCartel}
          disabled={exportando}
          className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          Imprimir cartel
        </Button>
      </div>
    </div>
  );
}
