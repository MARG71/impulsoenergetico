import Link from "next/link";

export default function Subvenciones() {
  return (
    <main className="w-full">
      <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">Subvenciones</h1>
            <Link
              href="/solar/estudio"
              className="rounded-full bg-[#FFC107] px-6 py-3 font-extrabold text-black hover:opacity-95"
            >
              Pedir Estudio
            </Link>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-7">
            <p className="text-xl md:text-2xl text-white/75 leading-9">
              Aquí mostramos ayudas y bonificaciones según tu zona. Si quieres, lo conectamos a contenido real por provincia.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
