"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import QRCode from "react-qr-code";
import QR from "qrcode";

import { Button } from "@/components/ui/button";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

type Fondo = {
  id: number;
  nombre: string;
  url: string;
  activo?: boolean;
  creadoEn?: string;
};

type LugarApi = {
  id: number;
  agenteId: number;
  agente?: { id: number; nombre?: string | null; email?: string | null; telefono?: string | null } | null;
};

const IMPULSO_LOGO_SRC =
  "/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png";

const TELEFONO_FIJO = "692 137 048";

async function safeJson(res: Response): Promise<{ ok: boolean; status: number; data: any; raw?: string }> {
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw: text?.slice(0, 300) };
  }
}

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";

  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;

  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const adminQuery = tenantMode && adminIdContext ? `?adminId=${adminIdContext}` : "";

  const id = params?.id;

  const [lugar, setLugar] = useState<LugarApi | null>(null);
  const [fondoActivo, setFondoActivo] = useState<Fondo | null>(null);

  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [exportando, setExportando] = useState(false);
  const cartelRef = useRef<HTMLDivElement | null>(null);

  const [qrPng, setQrPng] = useState<string>("");
  const [bgReady, setBgReady] = useState(false);

  const fondoUrl = fondoActivo?.url ?? null;

  const agenteTelefono = useMemo(() => {
    const t = String(lugar?.agente?.telefono ?? "").trim();
    return t || TELEFONO_FIJO;
  }, [lugar]);

  const agenteNombre = useMemo(() => {
    const n = String(lugar?.agente?.nombre ?? "").trim();
    return n || "Impulso Energético";
  }, [lugar]);

  const qrUrl = useMemo(() => {
    if (!lugar) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;
  }, [lugar]);

  // QR PNG para el PDF (evita SVG)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!qrUrl) return;
        const dataUrl = await QR.toDataURL(qrUrl, {
          margin: 1,
          width: 700,
          errorCorrectionLevel: "H",
        });
        if (alive) setQrPng(dataUrl);
      } catch {
        if (alive) setQrPng("");
      }
    })();
    return () => {
      alive = false;
    };
  }, [qrUrl]);

  // Cargar lugar y fondo activo
  useEffect(() => {
    if (!id) return;

    let alive = true;

    const fetchLugar = async () => {
      const res = await fetch(`/api/lugares/${id}${adminQuery}`, { cache: "no-store" });
      const out = await safeJson(res);
      if (!out.ok) {
        const msg = (out.data && (out.data.error || out.data.message)) || out.raw || `Error HTTP ${out.status}`;
        throw new Error(msg);
      }
      return out.data as LugarApi;
    };

    const fetchFondoActivo = async () => {
      const res = await fetch(`/api/fondos?filtro=todos`, { cache: "no-store" });
      const out = await safeJson(res);
      if (!out.ok) {
        const msg = (out.data && (out.data.error || out.data.message)) || out.raw || `Error HTTP ${out.status}`;
        throw new Error(msg);
      }

      const data = out.data as Fondo[];

      if (!Array.isArray(data) || data.length === 0) {
        return { fondo: null as Fondo | null, warn: "No hay fondos subidos aún. Sube uno en /lugares/fondos." };
      }

      const activo = data.find((f) => Boolean(f.activo) && Boolean(f.url));
      if (activo) return { fondo: activo, warn: null as string | null };

      const primero = data.find((f) => Boolean(f.url)) ?? null;
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
        setBgReady(false);

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

  const cleanupHtml2PdfOverlays = () => {
    try {
      document.querySelectorAll(".html2pdf__overlay, .html2pdf__container").forEach((el) => el.remove());
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

  async function waitForBgReady(timeoutMs = 4500) {
    const start = Date.now();
    while (!bgReady && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  const descargarPDF = async () => {
    if (!cartelRef.current || !lugar) return;

    try {
      setExportando(true);
      cleanupHtml2PdfOverlays();
      await waitForBgReady(5000);

      const html2pdf = (await import("html2pdf.js")).default as any;

      cartelRef.current.getBoundingClientRect();

      const worker = html2pdf()
        .from(cartelRef.current)
        .set({
          margin: 0,
          filename: `cartel_lugar_${lugar.id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2.5,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff",
            logging: false,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        });

      let pdfBlob: Blob | null = null;

      try {
        pdfBlob = await worker.outputPdf("blob");
      } catch {
        try {
          pdfBlob = await worker.output("blob");
        } catch {}
      }

      if (!pdfBlob) throw new Error("No se pudo generar el PDF (html2pdf falló).");

      // ✅ descarga local (primero)
      downloadBlob(pdfBlob, `cartel_lugar_${lugar.id}.pdf`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error generando PDF");
    } finally {
      cleanupHtml2PdfOverlays();
      setExportando(false);
    }
  };

  const imprimirCartel = () => {
    if (!cartelRef.current) return;

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
            window.onload = () => { window.focus(); window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
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

          <Button onClick={() => router.back()} className="bg-gray-200 text-black hover:bg-gray-300">
            ⬅ Volver
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
          src={fondoUrl}
          alt="Fondo del cartel"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
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

        {/* Recuadro blanco inferior */}
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
              overflow: "hidden",
            }}
          >
            {qrPng ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrPng} alt="QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <QRCode value={qrUrl} size={145} />
            )}
          </div>

          {/* Centro */}
          <div style={{ flex: 1, textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMPULSO_LOGO_SRC}
              alt="Impulso Energético"
              style={{ height: "15mm", margin: "0 auto 4mm auto", objectFit: "contain" }}
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

            <div style={{ marginTop: "3mm", fontSize: "9.4pt", fontWeight: 800, color: "#374151" }}>
              <span style={{ fontWeight: 900 }}>
                {lugar?.agente?.email ?? "info@impulsoenergetico.es"} · {agenteTelefono}
              </span>
              <span> · www.impulsoenergetico.es</span>
            </div>
          </div>

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
  