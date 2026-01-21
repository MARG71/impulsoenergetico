"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SolarHeader from "../_shared/SolarHeader";
import SolarFooter from "../_shared/SolarFooter";
import SolarHeroImage from "../_shared/SolarHeroImage";
import { useBuildQuery } from "../_shared/useBuildQuery";
import { solarCategories, solarProducts } from "@/lib/solarStore";
import { useSolarCart } from "@/lib/solarCart";

export default function TiendaHome() {
  const router = useRouter();
  const { buildQuery } = useBuildQuery();
  const { add } = useSolarCart();

  const [q, setQ] = useState("");

  const destacados = useMemo(
    () => solarProducts.filter((p) => p.destacado || p.titulo.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 md:py-10">
        <SolarHeader />

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start mb-10">
          <div className="rounded-3xl border border-emerald-500/25 bg-slate-950/70 p-6 md:p-8">
            <div className="text-[10px] md:text-xs font-semibold tracking-[0.30em] text-emerald-200 uppercase">
              Tienda Solar Impulso
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">Compra equipos solares con asesoramiento</h1>
            <p className="text-sm text-slate-200 mt-2 max-w-2xl">
              Kits, paneles, baterías e inversores. Si no sabes cuál elegir, te ayudamos gratis.
            </p>

            <div className="mt-5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar: kit 3kW, batería litio, panel 450W…"
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {solarCategories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => router.push(`/solar/tienda/categoria/${c.slug}${buildQuery()}`)}
                  className="text-left rounded-3xl border border-slate-700 bg-slate-900/60 p-5 hover:border-emerald-500/40 hover:bg-slate-900/80 transition"
                >
                  <p className="text-emerald-300 font-semibold">{c.titulo}</p>
                  <p className="text-xs text-slate-200 mt-1">{c.descripcion}</p>
                </button>
              ))}
            </div>
          </div>

          <SolarHeroImage src="/solar/tienda.jpg" alt="Tienda Solar Impulso" />
        </section>

        <section className="mb-10">
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Productos destacados</h2>
            <button
              onClick={() => router.push(`/solar/tienda/carrito${buildQuery()}`)}
              className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-900"
            >
              Ver carrito →
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {destacados.slice(0, 6).map((p) => (
              <div key={p.slug} className="rounded-3xl border border-slate-700 bg-slate-950/60 p-5">
                <p className="text-emerald-300 font-semibold">{p.titulo}</p>
                <p className="text-xs text-slate-200 mt-1">{p.resumen}</p>
                <p className="text-amber-300 font-extrabold mt-3">{p.precio.toFixed(2)} €</p>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => router.push(`/solar/tienda/producto/${p.slug}${buildQuery()}`)}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-900"
                  >
                    Ver detalles
                  </button>
                  <button
                    onClick={() => add(p.slug, 1)}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <SolarFooter />
      </div>
    </div>
  );
}
