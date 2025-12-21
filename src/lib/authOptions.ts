// src/lib/authOptions.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toString().trim().toLowerCase();

        // ✅ seleccionamos solo lo necesario (y añadimos adminId)
        const user = await prisma.usuario.findUnique({
          where: { email },
          select: {
            id: true,
            nombre: true,
            email: true,
            password: true,
            rol: true,
            adminId: true,
            agenteId: true,
            lugarId: true,
          },
        });

        if (!user?.password) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        // ✅ IMPORTANTÍSIMO: devolver id como number + adminId
        return {
          id: user.id,
          name: user.nombre,
          email: user.email,
          role: user.rol,           // SUPERADMIN | ADMIN | AGENTE | LUGAR | CLIENTE
          adminId: user.adminId ?? null,
          agenteId: user.agenteId ?? null,
          lugarId: user.lugarId ?? null,
        } as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        (token as JWT & any).id = u.id;                 // number
        (token as JWT & any).role = u.role;
        (token as JWT & any).adminId = u.adminId ?? null;
        (token as JWT & any).agenteId = u.agenteId ?? null;
        (token as JWT & any).lugarId = u.lugarId ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;                 // number
        (session.user as any).role = (token as any).role;
        (session.user as any).adminId = (token as any).adminId ?? null;
        (session.user as any).agenteId = (token as any).agenteId ?? null;
        (session.user as any).lugarId = (token as any).lugarId ?? null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
