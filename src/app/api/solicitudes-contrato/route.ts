import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, where: "app/api/solicitudes-contrato" });
}

// ✅ PRUEBA DEFINITIVA: POST sin lógica
export async function POST() {
  return NextResponse.json({ ok: true, test: "POST LLEGA" }, { status: 200 });
}
