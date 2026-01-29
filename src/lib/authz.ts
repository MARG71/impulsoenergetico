import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; // ajusta si tu authOptions está en otra ruta

export async function requireRole(roles: string[]) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || (session?.user as any)?.rol;

  if (!session || !role || !roles.includes(role)) {
    return { ok: false as const, session: null };
  }
  return { ok: true as const, session };
}
