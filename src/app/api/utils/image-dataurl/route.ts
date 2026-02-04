// src/app/api/utils/image-dataurl/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url).searchParams.get("url");
    if (!url) return jsonError("Falta url", 400);

    // ✅ Seguridad mínima: solo permitimos Cloudinary (ajusta si usas otro host)
    const u = new URL(url);
    const host = u.host.toLowerCase();
    if (!host.includes("cloudinary.com")) {
      return jsonError("Host no permitido", 400);
    }

    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return jsonError(`No se pudo descargar imagen (${r.status})`, 400);

    const ct = r.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await r.arrayBuffer());
    const b64 = buf.toString("base64");
    const dataUrl = `data:${ct};base64,${b64}`;

    return NextResponse.json({ ok: true, dataUrl }, { status: 200 });
  } catch (e: any) {
    return jsonError(e?.message || "Error generando dataUrl", 500);
  }
}
