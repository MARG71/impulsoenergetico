import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function getSessionOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("NO_AUTH");
  return session;
}

export function sessionRole(session: any) {
  return (session?.user as any)?.role as
    | "SUPERADMIN"
    | "ADMIN"
    | "AGENTE"
    | "LUGAR"
    | "CLIENTE"
    | undefined;
}

export function sessionAdminId(session: any) {
  const role = sessionRole(session);
  const userId = Number((session?.user as any)?.id);
  const adminId = (session?.user as any)?.adminId;

  // SUPERADMIN: sin filtro
  if (role === "SUPERADMIN") return null;

  // ADMIN: su tenant es él mismo (id)
  if (role === "ADMIN") return userId;

  // AGENTE/LUGAR: usan adminId del token
  return adminId ?? null;
}

export function sessionAgenteId(session: any) {
  return (session?.user as any)?.agenteId ?? null;
}

export function sessionLugarId(session: any) {
  return (session?.user as any)?.lugarId ?? null;
}
