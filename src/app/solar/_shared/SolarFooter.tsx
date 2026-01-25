// src/app/solar/_shared/SolarFooter.tsx
export default function SolarFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto w-full max-w-[1600px] px-4 md:px-8 py-10 text-white/70">
        <div className="text-lg font-extrabold text-white">Impulso Energético</div>
        <div className="mt-2">Energía Solar · Instalación · Legalización · Subvenciones</div>
        <div className="mt-4 text-sm text-white/50">
          © {new Date().getFullYear()} Impulso Energético
        </div>
      </div>
    </footer>
  );
}
