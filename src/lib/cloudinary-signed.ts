// src/lib/cloudinary-signed.ts
// src/lib/cloudinary-signed.ts
import { cloudinary } from "@/lib/cloudinary";

export type Delivery = "authenticated" | "private" | "upload";
export type Resource = "raw" | "image" | "video";

export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: Resource;
  deliveryType?: Delivery;
  attachment?: boolean;
  format?: string;
  version?: number;
  expiresInSeconds?: number; // solo informativo
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

  // ✅ Nota: en Cloudinary el "type" define upload/authenticated/private
  // ✅ version ayuda MUCHO a evitar 404 cuando hay colisiones/invalidate
  const url = cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    resource_type: resourceType,
    type: deliveryType,
    ...(typeof version === "number" ? { version } : {}),
    ...(format ? { format } : {}),
    ...(attachment ? { flags: "attachment" } : {}),
  });

  return { url, expiresAt };
}
