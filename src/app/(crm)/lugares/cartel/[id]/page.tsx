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

const EMAIL = "info@impulsoenergetico.es";
const WEB = "www.impulsoenergetico.es";

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

  const TELEFONO_FIJO = "692 137 048"; // por si el agente no tiene teléfono

  const agenteTelefono = useMemo(() => {
    const t = String(lugar?.agente?.telefono ?? "").trim();
    return t || TELEFONO_FIJO;
  }, [lugar]);

  const agenteNombre = useMemo(() => {
    const n = String(lugar?.agente?.nombre ?? "").trim();
    return n || "Impulso Energético";
  }, [lugar]);


  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  const [fondoActivo, setFondoActivo] = useState<Fondo | null>(null);
  const fondoUrl = fondoActivo?.url ?? null;

  const [exportando, setExportando] = useState(false);
  const cartelRef = useRef<HTMLDivElement>(null);

  // Link QR real del lugar
  const qrUrl = useMemo(() => {
    if (!lugar) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;
  }, [lugar]);

  const clubLogoUrl = useMemo(() => {
    // En cartel A4 normal NO lo usamos, pero lo dejo preparado si algún día quieres “A4 especial”
    return lugar?.especialLogoUrl ?? null;
  }, [lugar]);

  // Fetch lugar + fondo activo
  useEffect(() => {
    if (!id) return;

    const fetchLugar = async () => {
      const res = await fetch(`/api/lugares/${id}${adminQuery}`, { cache: "no-store" });
      const data = await res.json();
      setLugar(data);
    };

    const fetchFondoActivo = async () => {
      const res = await fetch(`/api/fondos?filtro=todos`, { cache: "no-store" });
      const data = (await res.json()) as Fondo[];

      if (!Array.isArray(data) || data.length === 0) {
        setFondoActivo(null);
        setWarning("No hay fondos subidos aún. Sube uno en /lugares/fondos.");
        return;
      }

      const activo = data.find((f) => !!f.activo);
      if (activo?.url) {
        setFondoActivo(activo);
        setWarning(null);
        return;
      }

      if (data[0]?.url) {
        setFondoActivo(data[0]);
        setWarning(
          "No hay ningún fondo marcado como activo. Mostrando el más reciente. (Activa uno en /lugares/fondos)"
        );
      } else {
        setFondoActivo(null);
        setWarning("No se pudo obtener URL de fondo.");
      }
    };

    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchLugar(), fetchFondoActivo()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, adminQuery]);

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

    registrarHistorial("IMPRIMIR");

    const contenido = cartelRef.current.innerHTML;
    const ventana = window.open("", "", "width=800,height=1000");
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>Imprimir Cartel</title>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; }
            .cartel { width: 210mm; height: 297mm; position: relative; overflow: hidden; }
            img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>
          <div class="cartel">${contenido}</div>
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
  };

  // Descargar PDF (historial + Cloudinary)
  const descargarPDF = async () => {
    if (!cartelRef.current || !lugar) return;

    try {
      setExportando(true);
      cleanupHtml2PdfOverlays();

      const cartelId = await registrarHistorial("DESCARGAR_PDF");
      if (!cartelId) throw new Error("No se pudo crear el registro de historial (sin ID).");

      const html2pdf = (await import("html2pdf.js")).default;

      let pdfBlob: Blob | null = null;

      try {
        const worker = html2pdf()
          .from(cartelRef.current)
          .set({
            margin: 0,
            html2canvas: {
              scale: 3,
              useCORS: true,
              allowTaint: true,
              logging: false,
              backgroundColor: "#ffffff",
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          });

        pdfBlob = await worker.outputPdf("blob");
      } catch (err) {
        console.warn("outputPdf(blob) falló, probando fallback output(blob)", err);
      }

      if (!pdfBlob) {
        try {
          const worker2 = html2pdf()
            .from(cartelRef.current)
            .set({
              margin: 0,
              html2canvas: { scale: 3, useCORS: true, backgroundColor: "#ffffff" },
              jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            });

          // @ts-ignore
          pdfBlob = await worker2.output("blob");
        } catch (err) {
          console.error("Fallback output(blob) falló", err);
        }
      }

      if (!pdfBlob) throw new Error("No se pudo generar el PDF (html2pdf falló).");

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
          src={fondoUrl}
          alt="Fondo del cartel"
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        {/* ✅ BLOQUE INFERIOR (dentro del recuadro blanco del fondo) */}
        <div
          style={{
            position: "absolute",
            left: "12mm",
            right: "12mm",
            bottom: "12mm",
            height: "42mm",
            zIndex: 5,
            display: "flex",
            gap: "10mm",
            alignItems: "center",
            padding: "6mm",
            // el fondo ya tiene el recuadro blanco,
            // pero esto asegura legibilidad si un fondo viene sin recuadro
            background: "rgba(255,255,255,0.00)",
          }}
        >
          {/* QR izquierda */}
          <div
            style={{
              width: "36mm",
              height: "36mm",
              background: "#ffffff",
              borderRadius: "8mm",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
            }}
          >
            <QRCode value={qrUrl} size={120} />
          </div>

          {/* Info derecha */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Logos */}
            <div style={{ display: "flex", gap: "8mm", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMPULSO_LOGO_SRC}
                alt="Impulso Energético"
                crossOrigin="anonymous"
                style={{ height: "14mm", width: "auto", objectFit: "contain" }}
              />

              {/* preparado por si algún día quieres “A4 especial” */}
              {clubLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={clubLogoUrl}
                  alt="Logo lugar"
                  crossOrigin="anonymous"
                  style={{ height: "14mm", width: "auto", objectFit: "contain" }}
                />
              ) : null}
            </div>

            {/* Texto */}
            <div style={{ marginTop: "3mm", fontFamily: "Arial, sans-serif" }}>
              <div style={{ fontSize: "12pt", fontWeight: 800, color: "#0f172a" }}>
                {agenteNombre}
              </div>
              <div style={{ fontSize: "10pt", fontWeight: 700, color: "#0f172a" }}>
                Tel: {agenteTelefono}
              </div>
              <div style={{ fontSize: "9.5pt", fontWeight: 700, color: "#0f172a" }}>
                {EMAIL} · {WEB}
              </div>
            </div>
          </div>
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
