import { v2 as cloudinary } from "cloudinary";

export function cloudinarySignedUrl(opts: {
  publicId: string;
  resourceType?: "raw" | "image" | "video";
  deliveryType?: "authenticated" | "private" | "upload";
  expiresInSeconds?: number;
  attachment?: boolean;
  format?: string; // "pdf"
}) {
  const {
    publicId,
    resourceType = "raw",
    deliveryType = "authenticated",
    expiresInSeconds = 60 * 60 * 24 * 7, // 7 días
    attachment = false,
    format,
  } = opts;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // ✅ Para privados/authenticated: token __cld_token__
  if (deliveryType === "authenticated" || deliveryType === "private") {
    const url = cloudinary.utils.private_download_url(publicId, format || "pdf", {
      resource_type: resourceType,
      type: deliveryType, // "authenticated" o "private"
      expires_at: expiresAt,
      attachment,
    });

    return { url, expiresAt };
  }

  // ✅ Para públicos (upload) no hace falta firmar
  const url = cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "upload",
    secure: true,
    ...(format ? { format } : {}),
  });

  return { url, expiresAt };
}
