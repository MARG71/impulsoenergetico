// middleware.ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// 🔹 Rutas que forman parte del CRM (solo ADMIN y AGENTE)
const ADMIN_OR_AGENT_PATHS = [
  '/dashboard',
  '/agentes',
  '/lugares',
  '/leads',
  '/fondos',
  '/productos-ganaderos',
  '/ofertas',           // ajusta o añade más si tienes ruta específica
  '/configuracion',     // ejemplo, por si la añades
]

// 🔹 Rutas de la zona cliente (LUGAR)
const LUGAR_PATHS = ['/zona-lugar']

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // 🔓 Estas rutas ya las hacemos públicas vía config.matcher (abajo),
  // pero si en el futuro ampliamos matcher, esto nos protege igualmente.
  const publicPaths = ['/login', '/unauthorized', '/bienvenida', '/registro']
  if (publicPaths.includes(path)) {
    return NextResponse.next()
  }

  // 🔑 Leemos el token JWT de NextAuth
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  console.log('🛡️ Middleware: token recibido:', token)
  console.log('➡️ Ruta solicitada:', path)

  // 🧱 Si no hay token y no es ruta pública → al login
  if (!token) {
    console.log('❌ No hay token, redirigiendo a /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = token.role as 'ADMIN' | 'AGENTE' | 'LUGAR' | undefined

  // Helpers para saber qué tipo de ruta es
  const isAdminOrAgentPath = ADMIN_OR_AGENT_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`)
  )

  const isZonaLugarPath = LUGAR_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`)
  )

  // 🎯 Zona del cliente: /zona-lugar
  if (isZonaLugarPath) {
    if (role === 'LUGAR' || role === 'ADMIN' || role === 'AGENTE') {
      // Permitimos también ADMIN/AGENTE para que puedas ver su zona si quieres
      return NextResponse.next()
    }
    console.log(`❌ Acceso denegado a /zona-lugar para rol ${role}`)
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // 🎯 CRM: dashboard, agentes, lugares, leads, etc.
  if (isAdminOrAgentPath) {
    if (role === 'ADMIN' || role === 'AGENTE') {
      return NextResponse.next()
    }
    console.log(`❌ Acceso denegado a zona CRM para rol ${role} en ruta ${path}`)
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // ✅ Para cualquier otra ruta que pase por el middleware:
  // con estar autenticado (cualquier rol) es suficiente
  return NextResponse.next()
}

// 👇 Aquí marcamos qué rutas pasan por el middleware
export const config = {
  matcher: [
    // Todo lo que NO sea:
    // - /api
    // - estáticos de Next
    // - favicon
    // - tu logo
    // - login
    // - unauthorized
    // - bienvenida (pública)
    // - registro (pública)
    '/((?!api|_next/static|_next/image|favicon.ico|logo-impulso.jpeg|login|unauthorized|bienvenida|registro).*)',
  ],
}
