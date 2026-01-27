// src/lib/cloudinary-signed.ts
// src/lib/cloudinary-signed.ts
import { cloudinary } from "@/lib/cloudinary";

export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  deliveryType?: "authenticated" | "private" | "upload";
  expiresInSeconds?: number;
  attachment?: boolean;
  format?: string; // ✅ NUEVO: "pdf", "png", etc.
}) {
  const {
    publicId,
    resourceType = "raw",
    deliveryType = "authenticated",
    expiresInSeconds = 60 * 20,
    attachment = false,
    format,
  } = opts;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const url = cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    expires_at: expiresAt,
    resource_type: resourceType,
    type: deliveryType,
    ...(format ? { format } : {}), // ✅ añade extensión al final del URL
    ...(attachment ? { flags: "attachment" } : {}),
  });

  return { url, expiresAt };
}

