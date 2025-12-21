// src/lib/menuConfig.ts
// ✅ src/lib/menuConfig.ts

export type Role = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR";

export type MenuItem = {
  href: string;
  label: string;
  icon: string;
  group: "PRINCIPAL" | "GESTION" | "AVANZADO" | "SUPERADMIN";
};

export const MENU_BY_ROLE: Record<Role, MenuItem[]> = {
  SUPERADMIN: [
    // PRINCIPAL
    { group: "PRINCIPAL", label: "Dashboard", href: "/dashboard", icon: "📊" },
    { group: "PRINCIPAL", label: "Pipeline", href: "/pipeline-agentes", icon: "🧩" },
    { group: "PRINCIPAL", label: "Historial comparativas", href: "/dashboard/historial", icon: "📂" },
    { group: "PRINCIPAL", label: "Comparador", href: "/comparador", icon: "🧮" },

    // GESTIÓN (global)
    { group: "GESTION", label: "Admins", href: "/admins", icon: "👑" },
    { group: "GESTION", label: "Agentes", href: "/agentes", icon: "👤" },
    { group: "GESTION", label: "Lugares", href: "/lugares", icon: "📍" },
    { group: "GESTION", label: "Leads", href: "/leads", icon: "🧾" },

    // AVANZADO
    { group: "AVANZADO", label: "Fondos carteles", href: "/lugares/fondos", icon: "🖼️" },
    { group: "AVANZADO", label: "Ofertas", href: "/ofertas", icon: "📢" },
    { group: "AVANZADO", label: "Productos ganaderos", href: "/productos-ganaderos", icon: "🐄" },
    { group: "AVANZADO", label: "Crear acceso usuario", href: "/crear-usuario", icon: "🔐" },
    { group: "AVANZADO", label: "Defaults comisión", href: "/dashboard/comisiones/defaults", icon: "⚖️" },
  ],

  ADMIN: [
    { group: "PRINCIPAL", label: "Dashboard", href: "/dashboard", icon: "📊" },
    { group: "PRINCIPAL", label: "Pipeline", href: "/pipeline-agentes", icon: "🧩" },
    { group: "PRINCIPAL", label: "Historial comparativas", href: "/dashboard/historial", icon: "📂" },
    { group: "PRINCIPAL", label: "Comparador", href: "/comparador", icon: "🧮" },

    { group: "GESTION", label: "Agentes", href: "/agentes", icon: "👤" },
    { group: "GESTION", label: "Lugares", href: "/lugares", icon: "📍" },
    { group: "GESTION", label: "Leads", href: "/leads", icon: "🧾" },

    { group: "AVANZADO", label: "Fondos carteles", href: "/lugares/fondos", icon: "🖼️" },
    { group: "AVANZADO", label: "Ofertas", href: "/ofertas", icon: "📢" },
    { group: "AVANZADO", label: "Productos ganaderos", href: "/productos-ganaderos", icon: "🐄" },
    { group: "AVANZADO", label: "Crear acceso usuario", href: "/crear-usuario", icon: "🔐" },
    { group: "AVANZADO", label: "Defaults comisión", href: "/dashboard/comisiones/defaults", icon: "⚖️" },
  ],

  AGENTE: [
    { group: "PRINCIPAL", label: "Dashboard", href: "/dashboard", icon: "📊" },
    { group: "PRINCIPAL", label: "Pipeline", href: "/pipeline-agentes", icon: "🧩" },
    { group: "PRINCIPAL", label: "Historial comparativas", href: "/dashboard/historial", icon: "📂" },
    { group: "PRINCIPAL", label: "Comparador", href: "/comparador", icon: "🧮" }, // si quieres que el agente lo use

    { group: "GESTION", label: "Lugares", href: "/lugares", icon: "📍" },
  ],

  LUGAR: [
    { group: "PRINCIPAL", label: "Dashboard", href: "/dashboard", icon: "📊" },
    { group: "PRINCIPAL", label: "Mi zona", href: "/zona-lugar", icon: "🏪" },
    { group: "PRINCIPAL", label: "Historial comparativas", href: "/dashboard/historial", icon: "📂" },
  ],
};
