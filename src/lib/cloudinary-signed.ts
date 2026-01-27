// src/lib/cloudinary-signed.ts
// src/lib/cloudinary-signed.ts
import { cloudinary } from "@/lib/cloudinary";

export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  deliveryType?: "authenticated" | "private" | "upload";
  attachment?: boolean;
  format?: string;
  version?: number;
  expiresInSeconds?: number; // lo mantenemos solo para devolver expiresAt (TU lógica), no se manda a Cloudinary
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

  // ✅ Esto es solo informativo para tu app (BD/shareExpiraEn manda)
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // ✅ CLAVE: NO pasar expires_at a Cloudinary
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

