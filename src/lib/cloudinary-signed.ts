// src/lib/cloudinary-signed.ts
import { cloudinary } from "@/lib/cloudinary";

export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  deliveryType?: "authenticated" | "private" | "upload";
  expiresInSeconds?: number;
  attachment?: boolean;
  format?: string;
}) {
  const {
    publicId,
    resourceType = "raw",
    deliveryType = "authenticated",
    expiresInSeconds = 60 * 60 * 24 * 7,
    attachment = false,
    format,
  } = opts;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const url = cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    expires_at: expiresAt,
    resource_type: resourceType, // raw|image|video
    type: deliveryType,          // authenticated|private|upload
    ...(attachment ? { flags: "attachment" } : {}),
    ...(format ? { format } : {}),
  });

  return { url, expiresAt };
}
