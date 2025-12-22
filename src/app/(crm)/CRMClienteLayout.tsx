// ✅ src/app/(crm)/CRMClienteLayout.tsx
'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Toaster } from "sonner";
import { MENU_BY_ROLE, type Role, type MenuItem } from "@/lib/menuConfig";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function groupLabel(g: MenuItem["group"]) {
  if (g === "PRINCIPAL") return "Principal";
  if (g === "GESTION") return "Gestión";
  if (g === "AVANZADO") return "Avanzado";
  return "Superadmin";
}

export default function CRMClienteLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = (session?.user as any)?.role as Role | undefined;

  const nombre = session?.user?.name || "Usuario Impulso";
  const rolLabel =
    role === "SUPERADMIN" ? "Superadmin"
    : role === "ADMIN" ? "Administrador"
    : role === "AGENTE" ? "Agente"
    : role === "LUGAR" ? "Lugar"
    : "";

  // ✅ tenantMode: solo para SUPERADMIN cuando hay ?adminId=
  const adminIdParam = searchParams?.get("adminId");
  const adminIdContext = adminIdParam ? Number(adminIdParam) : null;
  const tenantMode =
    role === "SUPERADMIN" &&
    Number.isFinite(adminIdContext) &&
    (adminIdContext as number) > 0;

  // ✅ si estamos en modo tenant, añadimos adminId a TODAS las rutas internas del menú
  const withTenant = (href: string) => {
    if (!tenantMode) return href;
    if (!href.startsWith("/")) return href;
    if (href.startsWith("/login") || href.startsWith("/unauthorized")) return href;

    const hasQuery = href.includes("?");
    return `${href}${hasQuery ? "&" : "?"}adminId=${adminIdContext}`;
  };

  const menu = role ? MENU_BY_ROLE[role] : [];

  const grouped = menu.reduce<Record<string, MenuItem[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  const Item = ({ href, label, icon }: MenuItem) => {
    const activo = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={withTenant(href)}
        className={cx(
          "group flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-extrabold transition",
          activo
            ? "bg-white/12 border border-white/15 shadow-[0_0_24px_rgba(255,255,255,0.06)]"
            : "hover:bg-white/10"
        )}
      >
        <span className={cx("text-[18px]", activo ? "" : "opacity-90")}>{icon}</span>
        <span
          className={cx(
            "truncate font-extrabold",
            activo ? "text-yellow-200" : "text-white/90 group-hover:text-white"
          )}
        >
          {label}
        </span>
        {activo && <span className="ml-auto text-[10px] text-white/60">●</span>}
      </Link>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900" />
    );
  }

  if (!session || !role) {
    return <>{children}</>;
  }

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

          {/* ✅ BANDA MODO TENANT */}
          {tenantMode && (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
              <div className="text-emerald-200 text-[12px] font-extrabold uppercase tracking-wider">
                Modo tenant
              </div>
              <div className="text-white font-extrabold mt-1">
                Viendo como Admin #{adminIdContext}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/admins")}
                  className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-[13px] font-extrabold text-white transition"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition"
                >
                  Salir
                </button>
              </div>
            </div>
          )}

          {/* Usuario */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="text-white text-[16px] font-extrabold leading-tight">{nombre}</div>

            <div className="mt-2 inline-flex items-center gap-2 text-[13px] font-bold">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.6)]" />
              <span className="text-white/85 font-extrabold uppercase tracking-wide">
                {rolLabel}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-[13px] font-extrabold text-white transition"
              >
                Cerrar sesión
              </button>

              <Link
                href={withTenant("/dashboard")}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-[13px] font-extrabold text-slate-950 transition shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                title="Ir al dashboard"
              >
                Ir
              </Link>
            </div>
          </div>

          {/* Navegación */}
          <nav className="mt-5 space-y-5">
            {(["PRINCIPAL", "GESTION", "AVANZADO", "SUPERADMIN"] as const).map((g) => {
              const items = grouped[g];
              if (!items || items.length === 0) return null;

              return (
                <div key={g}>
                  <div className="px-2 text-[12px] font-extrabold uppercase tracking-widest text-white/70 mb-2">
                    {groupLabel(g)}
                  </div>
                  <div className="space-y-1">
                    {items.map((i) => (
                      <Item key={i.href} {...i} />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-6 px-2 text-[12px] font-bold text-white/55">
            IMPULSO ENERGÉTICO · CRM
          </div>
        </aside>

        {/* CONTENIDO */}
        <main className="flex-1 p-6">{children}</main>

        <Toaster richColors position="top-center" />
      </div>
    </div>
  );
}
