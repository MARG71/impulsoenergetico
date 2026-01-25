import { v2 as cloudinary } from "cloudinary";

export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  deliveryType?: "upload" | "authenticated" | "private";
  expiresInSeconds?: number;
  attachment?: boolean;
  format?: string; // <-- importante para PDF
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
    resource_type: resourceType,
    type: deliveryType,
    sign_url: true,
    expires_at: expiresAt,
    ...(format ? { format } : {}),
    ...(attachment ? { flags: "attachment" } : {}),
  });

  return { url, expiresAt };
}
