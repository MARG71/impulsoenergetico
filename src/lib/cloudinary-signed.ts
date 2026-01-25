import { v2 as cloudinary } from "cloudinary";

/**
 * Genera una URL firmada que expira (en segundos).
 * Funciona para raw (pdf), image, video.
 * Soporta assets privados usando deliveryType: authenticated | private | upload
 * Soporta version y format para evitar 404 por mismatch.
 */
export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  deliveryType?: "authenticated" | "private" | "upload";
  expiresInSeconds?: number;
  attachment?: boolean;
  version?: number; // ✅ IMPORTANTE
  format?: string;  // ✅ IMPORTANTE (ej: pdf)
}) {
  const {
    publicId,
    resourceType = "raw",
    deliveryType = "authenticated",
    expiresInSeconds = 60 * 60 * 24 * 7, // 7 días
    attachment = false,
    version,
    format,
  } = opts;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const url = cloudinary.url(publicId, {
    resource_type: resourceType,
    type: deliveryType,
    sign_url: true,
    expires_at: expiresAt,

    // ✅ Si tenemos version, se añade para que Cloudinary resuelva la ruta correcta
    ...(typeof version === "number" ? { version } : {}),

    // ✅ Si tenemos formato, lo añadimos (raw a veces lo necesita)
    ...(format ? { format } : {}),

    // ✅ Descarga forzada (si lo activas)
    ...(attachment ? { flags: "attachment" } : {}),
  });

  return { url, expiresAt };
}
