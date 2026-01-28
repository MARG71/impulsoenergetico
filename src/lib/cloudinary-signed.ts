// src/lib/cloudinary-signed.ts
// src/lib/cloudinary-signed.ts
import { cloudinary } from "@/lib/cloudinary";

export type Delivery = "upload" | "authenticated" | "private";
export type Resource = "raw" | "image" | "video";

export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: Resource;
  deliveryType?: Delivery;
  attachment?: boolean;
  format?: string; // "pdf", "jpg"...
  version?: number;
  expiresInSeconds?: number;
}) {
  const {
    publicId,
    resourceType = "raw",
    deliveryType = "authenticated",
    attachment = false,
    format,
    version,
    expiresInSeconds = 60 * 20,
  } = opts;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // ✅ Caso público: upload (no hace falta private_download_url)
  if (deliveryType === "upload") {
    const url = cloudinary.url(publicId, {
      secure: true,
      sign_url: false,
      resource_type: resourceType as any,
      type: "upload",
      ...(typeof version === "number" ? { version } : {}),
      ...(format ? { format } : {}),
      ...(attachment ? { flags: "attachment" } : {}),
    });

    return { url, expiresAt };
  }

  // 🔒 Caso privado/authenticated: usar private_download_url (más fiable en RAW)
  const safeFormat = format || (resourceType === "raw" ? "pdf" : undefined);

  // Si no hay format (raro), caemos a URL firmada normal
  if (!safeFormat) {
    const url = cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      resource_type: resourceType as any,
      type: deliveryType as any,
      ...(typeof version === "number" ? { version } : {}),
      ...(attachment ? { flags: "attachment" } : {}),
    });
    return { url, expiresAt };
  }

  // ✅ private_download_url NO acepta "secure" en typings -> lo quitamos
  let url = cloudinary.utils.private_download_url(publicId, safeFormat, {
    resource_type: resourceType as any,
    type: deliveryType as any, // authenticated | private
    expires_at: expiresAt,
    ...(typeof version === "number" ? { version } : {}),
    ...(attachment ? { attachment: true } : {}),
  });

  // ✅ Forzar https por si devuelve http
  if (typeof url === "string") url = url.replace(/^http:\/\//, "https://");

  return { url, expiresAt };
}
