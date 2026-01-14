"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

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

  const downloadPNG = async () => {
    if (!posterRef.current) return;
    await registrarHistorial("DESCARGAR_PNG");

    const html2canvas = (await import("html2canvas")).default;

    const canvas = await html2canvas(posterRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = `cartel_especial_${lugar?.id ?? id}.png`;
    a.click();
  };

  const registrarHistorial = async (accion: "IMPRIMIR" | "DESCARGAR_PNG") => {
    try {
      await fetch("/api/carteles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "ESPECIAL",
          accion,
          lugarId: lugar?.id,
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


  const imprimir = () => window.print();

  registrarHistorial("IMPRIMIR");
  window.print();


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

  const qrUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/registro?agenteId=${lugar.agenteId}&lugarId=${lugar.id}`;

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

      <div
        ref={posterRef}
        className="relative border rounded-xl shadow-xl overflow-hidden"
        style={{ width: 540, height: 675 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lugar.especialCartelUrl}
          alt="Cartel especial"
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />

        {lugar.especialLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lugar.especialLogoUrl}
            alt="logo"
            className="absolute top-3 right-3 w-14 h-14 object-contain rounded-md"
            crossOrigin="anonymous"
          />
        )}

        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-6 bg-white p-3 rounded-xl shadow"
          style={{ width: 160, height: 160 }}
        >
          <QRCode value={qrUrl} size={154} />
        </div>
      </div>
    </div>
  );
}
