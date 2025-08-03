'use client'

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Toaster } from "sonner";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IMPULSO ENERGÉTICO CRM",
  description: "Panel de control administrativo",
};

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        <div className="flex min-h-screen">
          {/* MENÚ LATERAL AZUL */}
          <aside className="w-64 bg-[#004e89] text-white p-4 shadow-lg flex flex-col items-center">
            {/* LOGO */}
            <div className="mb-4">
              <Image
                src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                alt="Logo Impulso Energético"
                width={160}
                height={50}
                priority
              />
            </div>

            {/* INFO USUARIO */}
            {session?.user ? (
              <div className="text-white text-center text-sm mb-6">
                <div className="font-bold">{session.user.name}</div>
                <div className="text-gray-300 capitalize">{session.user.role?.toLowerCase()}</div>
              </div>
            ) : (
              <div className="text-center mb-6">
                <Link
                  href="/login"
                  className="bg-white text-blue-700 text-sm font-semibold py-1 px-3 rounded hover:bg-gray-100"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}

            {/* MENÚ DE NAVEGACIÓN */}
            <nav className="flex flex-col gap-6 text-md font-semibold w-full px-4">
              <Link href="/dashboard" className="hover:text-yellow-300 flex items-center gap-2">
                📊 Dashboard
              </Link>
              <Link href="/agentes" className="hover:text-yellow-300 flex items-center gap-2">
                👤 Agentes
              </Link>
              <Link href="/lugares" className="hover:text-yellow-300 flex items-center gap-2">
                📍 Lugares
              </Link>
              <Link href="/lugares/fondos" className="hover:text-yellow-300 flex items-center gap-2">
                🖼️ Fondos Carteles
              </Link>
              <Link href="/ofertas" className="hover:text-yellow-300 flex items-center gap-2">
                📢 Ofertas
              </Link>
              <Link href="/dashboard/historial" className="hover:text-yellow-300 flex items-center gap-2">
                📂 Historial Comparativas
              </Link>
              <Link href="/comparador" className="hover:text-yellow-300 flex items-center gap-2">
                🧮 Comparador
              </Link>
              <Link href="/crear-usuario" className="text-white hover:text-gray-300 px-4 py-2 block">
                Crear Acceso Usuario
              </Link>
            </nav>
          </aside>

          {/* CONTENIDO PRINCIPAL */}
          <main className="flex-1 p-6">{children}</main>
        </div>

        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
