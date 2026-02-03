"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

const EMAIL_FIJO = "info@impulsoenergetico.es";
const WEB = "www.impulsoenergetico.es";
const TELEFONO_FIJO = "692 137 048";

const IMPULSO_LOGO_SRC =
  "/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png";

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

  const adminQuery =
    tenantMode && adminIdContext ? `?adminId=${adminIdContext}` : "";

  const id = params?.id as string | undefined;

  const [lugar, setLugar] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [exportando, setExportando] = useState(false);
  const cartelRef = useRef<HTMLDivElement>(null);

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

  // ✅ Fondo especial del lugar
  const fondoUrl = useMemo(() => {
    const u = String(lugar?.especialCartelUrl ?? "").trim();
    return u || null;
  }, [lugar]);

  // ✅ Escudo/logo club SOLO en especial
  const logoClubUrl = useMemo(() => {
    const u = String(lugar?.especialLogoUrl ?? "").trim();
    return u || null;
  }, [lugar]);

  useEffect(() => {
    if (!id) return;

    const fetchLugar = async () => {
      const res = await fetch(`/api/lugares/${id}${adminQuery}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setLugar(data);
    };

    (async () => {
      try {
        setLoading(true);
        await fetchLugar();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, adminQuery]);

  const imprimirCartel = async () => {
    if (!cartelRef.current || !lugar) return;

    const contenido = cartelRef.current.innerHTML;
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

  // (De momento solo imprimimos/visualizamos igual que A4.
  // Si quieres también PDF + historial + cloudinary, lo copiamos 1:1 del A4 y cambiamos tipo a "ESPECIAL".)

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
          src={fondoUrl}
          alt="Fondo especial del cartel"
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

        {/* RECUADRO BLANCO INFERIOR (MISMO QUE A4 PERFECTO) */}
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
          {/* QR */}
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
            <QRCode value={qrUrl} size={135} />
          </div>

          {/* Centro: logo + nombre + contacto */}
          <div style={{ flex: 1, textAlign: "center" }}>
            {/* Logo Impulso */}
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

          {/* Derecha: escudo/logo club (SOLO ESPECIAL) */}
          <div style={{ width: "28mm", height: "28mm", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logoClubUrl ? (
              <img
                src={logoClubUrl}
                alt="Escudo / Logo del lugar"
                crossOrigin="anonymous"
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
