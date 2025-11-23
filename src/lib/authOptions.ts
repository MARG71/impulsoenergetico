// src/lib/authOptions.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Normalizar email
        const email = credentials.email.toString().trim().toLowerCase();

        // Buscar usuario en la tabla Usuario
        const user = await prisma.usuario.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(credentials.password, user.password);
        if (!ok) return null;

        // Lo que devolvemos aquí se mete en `user` dentro del callback jwt
        return {
          id: user.id.toString(),
          name: user.nombre,
          email: user.email,
          role: user.rol,
          agenteId: user.agenteId,
          lugarId: user.lugarId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // user viene de authorize la primera vez
      if (user) {
        const u = user as any;
        (token as JWT & any).id = u.id;
        (token as JWT & any).role = u.role;
        (token as JWT & any).agenteId = u.agenteId;
        (token as JWT & any).lugarId = u.lugarId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id?.toString();
        (session.user as any).role = (token as any).role;
        (session.user as any).agenteId = (token as any).agenteId;
        (session.user as any).lugarId = (token as any).lugarId;
      }
      return session;
    },
  },
};
