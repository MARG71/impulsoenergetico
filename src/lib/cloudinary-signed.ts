import { v2 as cloudinary } from "cloudinary";

/**
 * Genera una URL firmada que expira (en segundos).
 * Para RAW (pdf), IMAGE, VIDEO.
 *
 * IMPORTANTE: pasa "version" si quieres que la URL apunte al asset correcto
 * (si no, el SDK puede poner v1 y dar 404).
 */
export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  expiresInSeconds?: number;
  attachment?: boolean;
  version?: number; // ✅ NUEVO
}) {
  const {
    publicId,
    resourceType = "raw",
    expiresInSeconds = 60 * 60 * 24 * 7, // 7 días
    attachment = false,
    version, // ✅ NUEVO
  } = opts;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const url = cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    expires_at: expiresAt,
    ...(typeof version === "number" ? { version } : {}), // ✅ CLAVE
    ...(attachment ? { flags: "attachment" } : {}),
  });

  return { url, expiresAt };
}
