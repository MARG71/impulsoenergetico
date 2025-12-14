import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Faltan variables de Cloudinary en el servidor." },
      { status: 500 }
    );
  }

  // IMPORTANTE: Cloudinary usa timestamp en segundos
  const timestamp = Math.floor(Date.now() / 1000);

  // Carpeta donde quieres guardar todo
  const folder = "impulso/solicitudes-contrato";

  // Firma: debes firmar EXACTAMENTE los mismos params que mandas en el upload
  // (en este caso folder + timestamp)
  const toSign = `folder=${folder}&timestamp=${timestamp}`;

  const signature = crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
  });
}
