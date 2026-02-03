"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

const IMPULSO_LOGO_SRC =
  "/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png";

const EMAIL = "info@impulsoenergetico.es";
const WEB = "www.impulsoenergetico.es";
const TELEFONO_FIJO = "692 137 048";

export default function CartelEspecial() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
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

  const [lugar, setLugar] = useState<any | null>(null);
  const [cargando, setCargando] = useState(true);
  const posterRef = useRef<HTMLDivElement>(null);

  const qrUrl = useMemo(() => {
    if (!lugar) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;
  }, [lugar]);

  const agenteNombre = useMemo(() => {
    if (!lugar) return "—";
    return lugar?.agente?.nombre || "Agente Impulso";
  }, [lugar]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/lugares/${id}${adminQuery}`, { cache: "no-store" });
        const d = await r.json();
        setLugar(d);
      } finally {
        setCargando(false);
      }
    })();
  }, [id, adminQuery]);

  const registrarHistorial = async (accion: "IMPRIMIR" | "DESCARGAR_PNG") => {
    try {
      await fetch("/api/carteles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "ESPECIAL",
          accion,
          lugarId: lugar?.id ?? Number(id),
          fondoId: null,
          fondoUrlSnap: lugar?.especialCartelUrl ?? null,
          qrUrlSnap: qrUrl,
          adminId: tenantMode ? adminIdContext : null,
        }),
      });
    } catch (e) {
      console.warn("No se pudo registrar historial del cartel especial:", e);
    }
  };

  const downloadPNG = async () => {
    if (!posterRef.current) return;
    await registrarHistorial("DESCARGAR_PNG");

    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(posterRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = `cartel_especial_${lugar?.id ?? id}.png`;
    a.click();
  };

  const imprimir = async () => {
    if (!posterRef.current) return;
    await registrarHistorial("IMPRIMIR");

    const contenido = posterRef.current.innerHTML;
    const ventana = window.open("", "", "width=800,height=1000");
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>Imprimir Cartel Especial</title>
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

  if (cargando) return <div className="p-10 text-center">Cargando...</div>;
  if (!lugar) return <div className="p-10 text-center">Lugar no encontrado</div>;

  if (!lugar.especial || !lugar.especialCartelUrl) {
    return (
      <div className="p-10 text-center">
        Este lugar no tiene cartel especial guardado.
        <div className="mt-4">
          <Button onClick={() => router.back()}>Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center gap-6">
      <div className="w-full max-w-4xl flex justify-between">
        <Button onClick={() => router.back()} variant="secondary">
          ⬅ Volver
        </Button>
        <div className="flex gap-2">
          <Button onClick={downloadPNG} className="bg-blue-600 text-white">
            Descargar PNG
          </Button>
          <Button onClick={imprimir} className="bg-green-600 text-white">
            Imprimir
          </Button>
        </div>
      </div>

      {/* CARTEL ESPECIAL en A4 */}
      <div
        ref={posterRef}
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
          src={lugar.especialCartelUrl}
          alt="Cartel especial"
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

        {/* ✅ BLOQUE INFERIOR (QR + logos + datos) */}
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
            <div style={{ display: "flex", gap: "8mm", alignItems: "center" }}>
              {/* Logo Impulso */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMPULSO_LOGO_SRC}
                alt="Impulso Energético"
                crossOrigin="anonymous"
                style={{ height: "14mm", width: "auto", objectFit: "contain" }}
              />

              {/* Logo club si existe */}
              {lugar.especialLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lugar.especialLogoUrl}
                  alt="Logo club"
                  crossOrigin="anonymous"
                  style={{ height: "14mm", width: "auto", objectFit: "contain" }}
                />
              ) : null}
            </div>

            <div style={{ marginTop: "3mm", fontFamily: "Arial, sans-serif" }}>
              <div style={{ fontSize: "12pt", fontWeight: 800, color: "#0f172a" }}>
                {agenteNombre}
              </div>
              <div style={{ fontSize: "10pt", fontWeight: 700, color: "#0f172a" }}>
                Tel: {TELEFONO_FIJO}
              </div>
              <div style={{ fontSize: "9.5pt", fontWeight: 700, color: "#0f172a" }}>
                {EMAIL} · {WEB}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
