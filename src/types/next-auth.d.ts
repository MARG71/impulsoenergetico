import "next-auth";
import "next-auth/jwt";

export type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

declare module "next-auth" {
  interface User {
    id: number;
    name: string;
    email: string;
    role: Rol;
    agenteId?: number | null;
    lugarId?: number | null;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    name?: string;
    email?: string;
    role?: Rol;
    agenteId?: number | null;
    lugarId?: number | null;
  }
}
