// src/app/solar/_shared/SolarFooter.tsx
import Link from "next/link";

export default function SolarFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#050712]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:px-10 md:grid-cols-3">
        <div>
          <div className="text-base font-extrabold">Impulso Energético</div>
          <div className="mt-2 text-sm text-white/60">
            Instalaciones solares para hogar y empresa. Acompañamiento completo.
          </div>
        </div>

        <div className="text-sm">
          <div className="font-bold text-white">Secciones</div>
          <div className="mt-3 grid gap-2 text-white/70">
            <Link href="/solar#beneficios" className="hover:text-white">
              Beneficios
            </Link>
            <Link href="/solar#proceso" className="hover:text-white">
              Proceso
            </Link>
            <Link href="/solar/tienda" className="hover:text-white">
              Tienda
            </Link>
            <Link href="/solar/faq" className="hover:text-white">
              FAQ
            </Link>
          </div>
        </div>

        <div className="text-sm">
          <div className="font-bold text-white">Contacto</div>
          <div className="mt-3 text-white/70">
            Email: info@impulsoenergetico.es
            <div className="mt-2">Horario: L-V 9:00–20:00</div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Impulso Energético
      </div>
    </footer>
  );
}
