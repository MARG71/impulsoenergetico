export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      // ...
      async authorize(credentials) {
        // normaliza email a lowerCase
        const email = credentials.email.toString().trim().toLowerCase();
        // busca usuario, compara contraseña y devuelve:
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
      if (user) {
        const u = user as any;
        (token as any).id = u.id;
        (token as any).role = u.role;
        (token as any).agenteId = u.agenteId;
        (token as any).lugarId = u.lugarId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role;
        (session.user as any).agenteId = (token as any).agenteId;
        (session.user as any).lugarId = (token as any).lugarId;
      }
      return session;
    },
  },
};
