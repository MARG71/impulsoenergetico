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

export default function CartelLugar() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const role = ((session?.user as any)?.role ?? null) as Rol | null;
  const isSuperadmin = role === "SUPERADMIN";

  // ✅ Tenant solo para buscar el lugar (NO para fondos en opción A)
  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;
  const tenantMode =
    isSuperadmin &&
    typeof adminIdContext === "number" &&
    Number.isFinite(adminIdContext) &&
    adminIdContext > 0;

  const adminQuery =
    tenantMode && adminIdContext ? `?adminId=${adminIdContext}` : "";

  const id = params?.id as string | undefined;

  const [lugar, setLugar] = useState<any | null>(null);
  const [exportando, setExportando] = useState(false);

  
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [fondoActivo, setFondoActivo] = useState<Fondo | null>(null);
  const fondoUrl = fondoActivo?.url ?? null;


  const cartelRef = useRef<HTMLDivElement>(null);

  // ✅ Link QR (cuando ya tenemos lugar)
  const qrUrl = useMemo(() => {
    if (!lugar) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;
  }, [lugar]);

  useEffect(() => {
    if (!id) return;

    const fetchLugar = async () => {
      const res = await fetch(`/api/lugares/${id}${adminQuery}`, { cache: "no-store" });
      const data = await res.json();
      setLugar(data);
    };

    const fetchFondoActivo = async () => {
      // ✅ Opción A: fondo global => NO usamos adminId aquí
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

      // ✅ fallback si nadie está marcado como activo: usa el más reciente (primer elemento)
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

  const registrarHistorial = async (accion: "IMPRIMIR" | "DESCARGAR_PDF") => {
    try {
      await fetch("/api/carteles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "A4_QR",
          accion,
          lugarId: lugar?.id,
          fondoId: fondoActivo?.id ?? null,
          fondoUrlSnap: fondoActivo?.url ?? null,
          qrUrlSnap: qrUrl,
          // si estás en tenantMode, lo mandamos (superadmin auditando otro admin)
          adminId: tenantMode ? adminIdContext : null,
        }),
      });
    } catch (e) {
      // ✅ No hacemos nada: nunca debe romper imprimir/descargar
      console.warn("No se pudo registrar historial del cartel:", e);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };


  const imprimirCartel = () => {
    registrarHistorial("IMPRIMIR");
    registrarHistorial("DESCARGAR_PDF");

    if (!cartelRef.current) return;

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
            .cartel {
              width: 210mm;
              height: 297mm;
              position: relative;
              overflow: hidden;
              margin: 0;
              padding: 0;
            }
            .cartel img {
              position: absolute;
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: 0;
            }
            .qr-centro {
              position: absolute;
              width: 5cm;
              height: 5cm;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              padding: 12px;
              border-radius: 12px;
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 2;
            }
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

  const cleanupHtml2PdfOverlays = () => {
    try {
      // html2pdf suele crear estos nodos
      document.querySelectorAll(".html2pdf__overlay, .html2pdf__container").forEach((el) => el.remove());

      // algunos casos dejan iframes “fantasma”
      document.querySelectorAll("iframe").forEach((el) => {
        // solo elimina los iframes “vacíos” o sospechosos
        if (!el.src || el.src === "about:blank") el.remove();
      });

      // por si dejó estilos bloqueando interacción
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
    } catch {}
  };


  const descargarPDF = async () => {
    if (!cartelRef.current) return;
    if (!lugar) return;

    try {
      setExportando(true);

      // 1) Crear registro de historial
      const rHist = await fetch("/api/carteles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "A4_QR",
          accion: "DESCARGAR_PDF",
          lugarId: lugar.id,
          fondoId: fondoActivo?.id ?? null,            // si ya lo tienes como objeto
          fondoUrlSnap: fondoActivo?.url ?? fondoUrl,  // fallback
          qrUrlSnap: qrUrl,
          adminId: tenantMode ? adminIdContext : null,
        }),
      });

      const dHist = await rHist.json().catch(() => ({}));
      if (!rHist.ok) throw new Error(dHist?.error || "No se pudo crear historial");

      const cartelId = dHist?.cartel?.id;
      if (!cartelId) throw new Error("Historial sin ID");

      // 2) Generar PDF como blob
      const html2pdf = (await import("html2pdf.js")).default;

      const worker = html2pdf()
        .from(cartelRef.current)
        .set({
          margin: 0,
          html2canvas: { scale: 3, useCORS: true, allowTaint: true, logging: false, backgroundColor: null },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        });

      // outputPdf('blob') funciona con html2pdf.js recientes
      const pdfBlob: Blob = await worker.outputPdf("blob");

      // 3) Subir PDF a Cloudinary vía /api/uploads
      const file = new File([pdfBlob], `cartel_lugar_${lugar.id}.pdf`, { type: "application/pdf" });

      const form = new FormData();
      form.append("file", file);
      form.append("folder", "impulso/carteles-generados");


      const rUp = await fetch("/api/uploads", { method: "POST", body: form });
      const dUp = await rUp.json().catch(() => ({}));

      if (!rUp.ok) throw new Error(dUp?.error || "Error subiendo PDF");

      // 4) Asociar archivo al historial
      const rPatch = await fetch(`/api/carteles/${cartelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivoUrl: dUp.url,
          archivoPublicId: dUp.publicId ?? null,
          archivoResourceType: dUp.resourceType ?? null,
          archivoMime: dUp.mime ?? "application/pdf",
          archivoBytes: dUp.bytes ?? null,
          archivoFormat: dUp.format ?? null,
        }),
      });

      const dPatch = await rPatch.json().catch(() => ({}));
      if (!rPatch.ok) throw new Error(dPatch?.error || "No se pudo asociar el PDF");

      // 5) Descargar localmente al usuario (sin overlays)
      downloadBlob(pdfBlob, `cartel_lugar_${lugar.id}.pdf`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error generando/subiendo PDF");
    } finally {
      // Limpieza overlays por si acaso
      try {
        document.querySelectorAll(".html2pdf__overlay, .html2pdf__container").forEach((el) => el.remove());
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
      } catch {}
      setExportando(false);
    }
  };



  if (loading) {
    return <div className="p-10 text-center">Cargando cartel...</div>;
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

  return (
    <div className="min-h-screen flex flex-col items-center bg-white p-6">
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between gap-3">
        <Button
          onClick={() => router.back()}
          className="bg-gray-200 text-black hover:bg-gray-300"
        >
          ⬅ Volver
        </Button>

        {warning ? (
          <div className="text-xs md:text-sm font-bold text-amber-700 bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg">
            {warning}
          </div>
        ) : null}
      </div>

      <div
        ref={cartelRef}
        className="relative border border-gray-300 shadow-xl overflow-hidden bg-white"
        style={{ width: "210mm", height: "297mm", position: "relative" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fondoUrl}
          alt="Fondo del cartel"
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          crossOrigin="anonymous"
        />

        <div
          className="qr-centro"
          style={{
            position: "absolute",
            width: "5cm",
            height: "5cm",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "12px",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2,
          }}
        >
          <QRCode value={qrUrl} size={160} />
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
