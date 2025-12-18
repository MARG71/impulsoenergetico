// ✅ src/app/(crm)/CRMClienteLayout.tsx
'use client'

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Toaster } from "sonner";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  roles?: Array<"ADMIN" | "AGENTE" | "LUGAR">;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function CRMClienteLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = (session?.user as any)?.role as "ADMIN" | "AGENTE" | "LUGAR" | undefined;
  const esAdmin = role === "ADMIN";

  const nombre = session?.user?.name || "Usuario Impulso";
  const rolLabel =
    role === "ADMIN" ? "Administrador" : role === "AGENTE" ? "Agente" : role === "LUGAR" ? "Lugar" : "";

  const navPrincipal: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "📊", roles: ["ADMIN", "AGENTE", "LUGAR"] },
    { href: "/pipeline-agentes", label: "Pipeline", icon: "🧩", roles: ["ADMIN", "AGENTE"] },
    { href: "/zona-lugar", label: "Mi zona", icon: "🏪", roles: ["LUGAR"] },
    { href: "/dashboard/historial", label: "Historial comparativas", icon: "📂", roles: ["ADMIN", "AGENTE", "LUGAR"] },
    { href: "/comparador", label: "Comparador", icon: "🧮", roles: ["ADMIN", "AGENTE"] },
  ];

  const navGestion: NavItem[] = [
    { href: "/agentes", label: "Agentes", icon: "👤", roles: ["ADMIN"] },
    { href: "/lugares", label: "Lugares", icon: "📍", roles: ["ADMIN", "AGENTE"] },
    { href: "/lugares/fondos", label: "Fondos carteles", icon: "🖼️", roles: ["ADMIN"] },
    { href: "/ofertas", label: "Ofertas", icon: "📢", roles: ["ADMIN"] },
  ];

  const navExtra: NavItem[] = [
    { href: "/dashboard/comisiones/defaults", label: "Defaults comisión", icon: "⚖️", roles: ["ADMIN"] },
    { href: "/productos-ganaderos", label: "Productos ganaderos", icon: "🐄", roles: ["ADMIN"] },
    { href: "/crear-usuario", label: "Crear acceso usuario", icon: "🔐", roles: ["ADMIN"] },
  ];

  const filtrar = (items: NavItem[]) =>
    items.filter((i) => !i.roles || (role && i.roles.includes(role)));

  const Item = ({ href, label, icon }: NavItem) => {
    const activo = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={cx(
          "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
          activo
            ? "bg-white/12 border border-white/15 shadow-[0_0_24px_rgba(255,255,255,0.06)]"
            : "hover:bg-white/8"
        )}
      >
        <span className={cx("text-base", activo ? "" : "opacity-90")}>{icon}</span>
        <span className={cx("truncate", activo ? "text-yellow-200" : "text-white/90 group-hover:text-white")}>
          {label}
        </span>
        {activo && <span className="ml-auto text-[10px] text-white/60">●</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="w-[280px] shrink-0 border-r border-white/10 bg-gradient-to-b from-[#003b68] via-[#004e89] to-[#003b68] px-4 py-5">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-2 shadow-[0_0_26px_rgba(0,0,0,0.25)]">
              <Image
                src="/LOGO%20DEFINITIVO%20IMPULSO%20ENERGETICO%20-%20AGOSTO2025%20-%20SIN%20DATOS.png"
                alt="Logo Impulso Energético"
                width={170}
                height={56}
                priority
              />
            </div>
          </div>

          {/* Usuario */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="text-white font-extrabold leading-tight">{nombre}</div>
            <div className="mt-1 inline-flex items-center gap-2 text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.6)]" />
              <span className="text-white/80">{rolLabel}</span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 text-xs font-semibold text-white transition"
              >
                Cerrar sesión
              </button>

              <Link
                href="/dashboard"
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                title="Ir al dashboard"
              >
                Ir
              </Link>
            </div>
          </div>

          {/* Navegación */}
          <nav className="mt-5 space-y-5">
            <div>
              <div className="px-2 text-[11px] uppercase tracking-wider text-white/60 mb-2">
                Principal
              </div>
              <div className="space-y-1">
                {filtrar(navPrincipal).map((i) => (
                  <Item key={i.href} {...i} />
                ))}
              </div>
            </div>

            {(esAdmin || role === "AGENTE") && (
              <div>
                <div className="px-2 text-[11px] uppercase tracking-wider text-white/60 mb-2">
                  Gestión
                </div>
                <div className="space-y-1">
                  {filtrar(navGestion).map((i) => (
                    <Item key={i.href} {...i} />
                  ))}
                </div>
              </div>
            )}

            {esAdmin && (
              <div>
                <div className="px-2 text-[11px] uppercase tracking-wider text-white/60 mb-2">
                  Avanzado
                </div>
                <div className="space-y-1">
                  {filtrar(navExtra).map((i) => (
                    <Item key={i.href} {...i} />
                  ))}
                </div>
              </div>
            )}
          </nav>

          <div className="mt-6 px-2 text-[11px] text-white/50">
            IMPULSO ENERGÉTICO · CRM
          </div>
        </aside>

        {/* CONTENIDO */}
        <main className="flex-1 p-6">
          {children}
        </main>

        <Toaster richColors position="top-center" />
      </div>
    </div>
  );
}
