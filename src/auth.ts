import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function auth(req?: NextRequest) {
  if (!req) return null;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token ? { user: { id: token.id, role: token.role, email: token.email } } : null;
}

