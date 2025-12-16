// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    agenteId?: number | null;
    lugarId?: number | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      agenteId?: number | null;
      lugarId?: number | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string | number;
    name?: string;
    email?: string;
    role?: string;
    agenteId?: number | null;
    lugarId?: number | null;
  }
}
