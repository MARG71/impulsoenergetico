import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center">
      {/* LOGO */}
      <Image
        src="/logo-impulso.jpeg"
        alt="Logo Impulso Energético"
        width={120}
        height={120}
        className="mb-6"
      />

      {/* TITULAR */}
      <h1 className="text-4xl font-bold text-[#004e89] mb-4">
        Bienvenido a Impulso Energético
      </h1>

      {/* DESCRIPCIÓN */}
      <p className="text-lg text-gray-700 mb-6 max-w-xl">
        Plataforma de energía inteligente para agentes, clientes y lugares.
        Escanee un código QR o acceda directamente al panel para comenzar.
      </p>

      {/* BOTÓN ACCESO AL CRM */}
      <Link
        href="/crm/login"
        className="bg-[#004e89] hover:bg-[#003a66] text-white px-6 py-3 rounded-full font-semibold transition"
      >
        Acceder al CRM
      </Link>
    </div>
  );
}
