import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function auth(req?: NextRequest) {
  if (!req) return null;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;

  return {
    user: {
      id: token.id,
      role: (token as any).role,
      email: token.email,
      agenteId: (token as any).agenteId ?? null,
      lugarId: (token as any).lugarId ?? null,
    },
  };
}
