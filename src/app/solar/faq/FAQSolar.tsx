import Link from "next/link";

export default function FAQSolar() {
  const faqs = [
    ["¿Cuánto puedo ahorrar?", "Habitualmente 60–70% según consumo y orientación."],
    ["¿Instalación?", "Normalmente 1–2 días."],
    ["¿Días nublados?", "Produce menos; con batería aprovechas mejor."],
    ["¿Permisos?", "Nos encargamos de trámites y legalización."],
  ];

  return (
    <main className="w-full">
      <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">FAQ Solar</h1>
            <Link
              href="/solar/estudio"
              className="rounded-full bg-[#FFC107] px-6 py-3 font-extrabold text-black hover:opacity-95"
            >
              Pedir Estudio
            </Link>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {faqs.map(([q, a]) => (
              <div key={q} className="rounded-3xl border border-white/10 bg-white/5 p-7">
                <div className="text-2xl font-extrabold">{q}</div>
                <div className="mt-3 text-lg text-white/75 leading-8">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
