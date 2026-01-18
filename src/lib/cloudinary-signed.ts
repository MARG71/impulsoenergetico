import { v2 as cloudinary } from "cloudinary";

export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  expiresInSeconds?: number;
  attachment?: boolean;
  version?: number;
  format?: string; // ✅ NUEVO
}) {
  const {
    publicId,
    resourceType = "raw",
    expiresInSeconds = 60 * 60 * 24 * 7,
    attachment = false,
    version,
    format, // ✅ NUEVO
  } = opts;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  const url = cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    expires_at: expiresAt,
    ...(typeof version === "number" ? { version } : {}),
    ...(format ? { format } : {}), // ✅ CLAVE
    ...(attachment ? { flags: "attachment" } : {}),
  });

  return { url, expiresAt };
}
