import { v2 as cloudinary } from "cloudinary";

/**
 * URL firmada (expira).
 * Para privados: authenticated/private/upload.
 * Si attachment=true => fuerza descarga (evita visor de Cloudinary).
 */
export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  deliveryType?: "authenticated" | "private" | "upload";
  expiresInSeconds?: number;
  attachment?: boolean;
  format?: string;
  version?: number;
}) {
  const {
    publicId,
    resourceType = "raw",
    deliveryType = "authenticated",
    expiresInSeconds = 60 * 60 * 24 * 7, // 7 días
    attachment = false,
    format,
    version,
  } = opts;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const url = cloudinary.url(publicId, {
    resource_type: resourceType,
    type: deliveryType,
    sign_url: true,
    expires_at: expiresAt,

    // 👇 Esto es CLAVE:
    // fuerza descarga y evita el visor que te está fallando
    ...(attachment ? { flags: "attachment" } : {}),

    ...(typeof version === "number" ? { version } : {}),
    ...(format ? { format } : {}),
  });

  return { url, expiresAt };
}
