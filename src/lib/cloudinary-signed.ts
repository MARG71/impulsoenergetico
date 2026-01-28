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
  format?: string;         // "pdf", "jpg"...
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
      resource_type: resourceType,
      type: "upload",
      ...(typeof version === "number" ? { version } : {}),
      ...(format ? { format } : {}),
      ...(attachment ? { flags: "attachment" } : {}),
    });

    return { url, expiresAt };
  }

  // 🔒 Caso privado/authenticated: usar private_download_url (mucho más fiable en RAW)
  // Cloudinary exige "format" para private_download_url -> si no viene, intentamos no romper:
  const safeFormat = format || (resourceType === "raw" ? "pdf" : undefined);

  // OJO: private_download_url requiere format, si no lo tenemos, caemos a cloudinary.url firmado
  if (!safeFormat) {
    const url = cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      resource_type: resourceType,
      type: deliveryType,
      ...(typeof version === "number" ? { version } : {}),
      ...(attachment ? { flags: "attachment" } : {}),
    });
    return { url, expiresAt };
  }

  const url = cloudinary.utils.private_download_url(publicId, safeFormat, {
    resource_type: resourceType,
    type: deliveryType,     // "authenticated" o "private"
    secure: true,
    expires_at: expiresAt,  // ✅ aquí sí aplica perfecto
    ...(typeof version === "number" ? { version } : {}),
    ...(attachment ? { attachment: true } : {}),
  });

  return { url, expiresAt };
}
