// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

import SessionProvider from "@/components/SessionProvider";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import type { Session } from "next-auth"; // 👈 añadimos el tipo

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IMPULSO ENERGÉTICO",
  description: "Tu asesor energético de confianza",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 👇 forzamos el tipo para que no sea `unknown`
  const session = (await getServerSession(authOptions)) as Session | null;

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <SessionProvider session={session}>
          {children}
          <Toaster richColors position="top-center" />
        </SessionProvider>
      </body>
    </html>
  );
}
