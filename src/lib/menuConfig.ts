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

    // ✅ NUEVAS (después de Leads)
    { group: "GESTION", label: "Comisiones", href: "/comisiones", icon: "💶" },
    { group: "GESTION", label: "Reglas comisión", href: "/comisiones/reglas", icon: "⚙️" },
    { group: "GESTION", label: "Contrataciones", href: "/contrataciones", icon: "📝" },
    { group: "GESTION", label: "Clientes", href: "/clientes", icon: "🧑‍💼" },

    // ✅ SOLO SUPERADMIN (accesos directos opcionales)
    { group: "SUPERADMIN", label: "Secciones", href: "/configuracion/secciones", icon: "🧱" },
    { group: "SUPERADMIN", label: "Comisiones globales", href: "/configuracion/comisiones-globales", icon: "🧩" },

    // AVANZADO
    { group: "AVANZADO", label: "Fondos carteles", href: "/lugares/fondos", icon: "🖼️" },
    { group: "AVANZADO", label: "Ofertas", href: "/crm/ofertas", icon: "📢" },
    { group: "AVANZADO", label: "Productos ganaderos", href: "/productos-ganaderos", icon: "🐄" },
    { group: "AVANZADO", label: "Crear acceso usuario", href: "/crear-usuario", icon: "🔐" },
  ],

  ADMIN: [
    // PRINCIPAL
    { group: "PRINCIPAL", label: "Dashboard", href: "/dashboard", icon: "📊" },
    { group: "PRINCIPAL", label: "Pipeline", href: "/pipeline-agentes", icon: "🧩" },
    { group: "PRINCIPAL", label: "Historial comparativas", href: "/dashboard/historial", icon: "📂" },
    { group: "PRINCIPAL", label: "Comparador", href: "/comparador", icon: "🧮" },

    // GESTIÓN
    { group: "GESTION", label: "Agentes", href: "/agentes", icon: "👤" },
    { group: "GESTION", label: "Lugares", href: "/lugares", icon: "📍" },
    { group: "GESTION", label: "Leads", href: "/leads", icon: "🧾" },

    // ✅ NUEVAS (después de Leads)
    { group: "GESTION", label: "Comisiones", href: "/comisiones", icon: "💶" },
    { group: "GESTION", label: "Reglas comisión", href: "/comisiones/reglas", icon: "⚙️" },
    { group: "GESTION", label: "Contrataciones", href: "/contrataciones", icon: "📝" },
    { group: "GESTION", label: "Clientes", href: "/clientes", icon: "🧑‍💼" },

    // ✅ Accesos directos opcionales para Admin
    { group: "AVANZADO", label: "Planes de comisión", href: "/comisiones/admin", icon: "🧠" },
    { group: "AVANZADO", label: "Mis comisiones", href: "/comisiones/mis-comisiones", icon: "📈" },

    // AVANZADO
    { group: "AVANZADO", label: "Fondos carteles", href: "/lugares/fondos", icon: "🖼️" },
    { group: "AVANZADO", label: "Ofertas", href: "/crm/ofertas", icon: "📢" },
    { group: "AVANZADO", label: "Productos ganaderos", href: "/productos-ganaderos", icon: "🐄" },
    { group: "AVANZADO", label: "Crear acceso usuario", href: "/crear-usuario", icon: "🔐" },
  ],

  AGENTE: [
    // PRINCIPAL
    { group: "PRINCIPAL", label: "Dashboard", href: "/dashboard", icon: "📊" },
    { group: "PRINCIPAL", label: "Pipeline", href: "/pipeline-agentes", icon: "🧩" },
    { group: "PRINCIPAL", label: "Historial comparativas", href: "/dashboard/historial", icon: "📂" },
    { group: "PRINCIPAL", label: "Comparador", href: "/comparador", icon: "🧮" },

    // GESTIÓN
    { group: "GESTION", label: "Lugares", href: "/lugares", icon: "📍" },

    // ✅ NUEVAS
    { group: "GESTION", label: "Comisiones", href: "/comisiones", icon: "💶" },
    { group: "GESTION", label: "Contrataciones", href: "/contrataciones", icon: "📝" },
    { group: "GESTION", label: "Clientes", href: "/clientes", icon: "🧑‍💼" },
  ],

  LUGAR: [
    // PRINCIPAL
    { group: "PRINCIPAL", label: "Dashboard", href: "/dashboard", icon: "📊" },
    { group: "PRINCIPAL", label: "Mi zona", href: "/zona-lugar", icon: "🏪" },
    { group: "PRINCIPAL", label: "Historial comparativas", href: "/dashboard/historial", icon: "📂" },

    // ✅ NUEVAS (en PRINCIPAL para que lo vean fácil)
    { group: "PRINCIPAL", label: "Comisiones", href: "/comisiones", icon: "💶" },
    { group: "PRINCIPAL", label: "Contrataciones", href: "/contrataciones", icon: "📝" },
    { group: "PRINCIPAL", label: "Clientes", href: "/clientes", icon: "🧑‍💼" },
  ],
};
