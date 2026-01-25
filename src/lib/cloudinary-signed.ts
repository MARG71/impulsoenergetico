import { v2 as cloudinary } from "cloudinary";

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
    deliveryType = "upload",
    expiresInSeconds = 60 * 60 * 24 * 7,
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
    ...(attachment ? { flags: "attachment" } : {}),
    ...(typeof version === "number" ? { version } : {}),
    ...(format ? { format } : {}),
  });

  return { url, expiresAt };
}
