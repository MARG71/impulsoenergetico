import Link from "next/link";

export default function ComoFunciona() {
  return (
    <main className="w-full">
      <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">
              Cómo funciona
            </h1>
            <Link
              href="/solar/estudio"
              className="rounded-full bg-[#FFC107] px-6 py-3 font-extrabold text-black hover:opacity-95"
            >
              Solicitar Estudio
            </Link>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              ["1) Estudio", "Analizamos tu consumo y tejado."],
              ["2) Presupuesto", "Te damos un plan claro y cerrado."],
              ["3) Instalación", "Equipo profesional en 1–2 días."],
              ["4) Legalización", "Tramitamos todo por ti."],
              ["5) Ahorro", "Monitorizas y ahorras desde el primer mes."],
              ["Soporte", "Seguimiento y postventa."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-3xl border border-white/10 bg-white/5 p-7">
                <div className="text-2xl font-extrabold">{t}</div>
                <div className="mt-3 text-lg text-white/75 leading-8">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
