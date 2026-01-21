// src/lib/solarStore.ts
export type SolarCategory = {
  slug: string;
  titulo: string;
  descripcion: string;
  image: string; // en /public/solar/...
};

export type SolarProduct = {
  slug: string;
  titulo: string;
  categoriaSlug: string;
  precio: number;
  image: string;
  resumen: string;
  specs: { k: string; v: string }[];
  destacado?: boolean;
};

export const solarCategories: SolarCategory[] = [
  { slug: "kits", titulo: "Kits Solares", descripcion: "Soluciones completas para autoconsumo", image: "/solar/tienda.jpg" },
  { slug: "paneles", titulo: "Paneles", descripcion: "Alta eficiencia para tejados y cubiertas", image: "/solar/residencial.jpg" },
  { slug: "baterias", titulo: "Baterías", descripcion: "Más autonomía, más ahorro", image: "/solar/bateria.jpg" },
  { slug: "inversores", titulo: "Inversores", descripcion: "Híbridos, red, aislada", image: "/solar/empresa.jpg" },
  { slug: "estructuras", titulo: "Estructuras", descripcion: "Soportes y fijaciones seguras", image: "/solar/proceso.jpg" },
];

export const solarProducts: SolarProduct[] = [
  {
    slug: "kit-solar-3kw",
    titulo: "Kit Solar Autoconsumo 3kW",
    categoriaSlug: "kits",
    precio: 1890,
    image: "/solar/tienda.jpg",
    resumen: "Kit equilibrado para vivienda media. Ideal para empezar a ahorrar.",
    destacado: true,
    specs: [
      { k: "Potencia", v: "3 kW" },
      { k: "Uso", v: "Autoconsumo conectado a red" },
      { k: "Incluye", v: "Paneles + inversor + protecciones" },
    ],
  },
  {
    slug: "panel-450w",
    titulo: "Panel Solar Monocristalino 450W",
    categoriaSlug: "paneles",
    precio: 129,
    image: "/solar/residencial.jpg",
    resumen: "Excelente relación potencia / superficie.",
    specs: [
      { k: "Potencia", v: "450 W" },
      { k: "Tecnología", v: "Monocristalino" },
      { k: "Garantía", v: "Según fabricante" },
    ],
  },
  {
    slug: "bateria-litio-5kwh",
    titulo: "Batería Litio 5 kWh",
    categoriaSlug: "baterias",
    precio: 1490,
    image: "/solar/bateria.jpg",
    resumen: "Aumenta tu autoconsumo y reduce la compra a red.",
    specs: [
      { k: "Capacidad", v: "5 kWh" },
      { k: "Tipo", v: "Litio" },
      { k: "Uso", v: "Híbrido/backup (según inversor)" },
    ],
  },
];
