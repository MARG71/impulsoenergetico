import { v2 as cloudinary } from "cloudinary";

/**
 * Genera una URL firmada que expira (en segundos).
 * Funciona para raw (pdf), image, video.
 * Si tu asset está como "authenticated", esta URL lo abre sin 401.
 */
export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  expiresInSeconds?: number;
  attachment?: boolean;
}) {
  const {
    publicId,
    resourceType = "raw",
    expiresInSeconds = 60 * 60 * 24 * 7, // 7 días
    attachment = false,
  } = opts;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Probamos con type authenticated (lo más típico para privados)
  const url = cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    expires_at: expiresAt,
    // Fuerza descarga si quieres (en vez de visor PDF)
    ...(attachment ? { flags: "attachment" } : {}),
  });

  return { url, expiresAt };
}
