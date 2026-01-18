import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  throw new Error(
    "Faltan variables de entorno de Cloudinary. Revisa CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
  );
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

export type UploadResourceType = "image" | "video" | "raw";

/**
 * Sube un buffer a Cloudinary usando upload_stream (ideal para Route Handlers).
 */
export async function uploadBufferToCloudinary(params: {
  buffer: Buffer;
  folder: string;
  filename?: string;
  resourceType?: UploadResourceType; // image/video/raw
}): Promise<{
  secure_url: string;
  public_id: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
  resource_type: string;
}> {
  const { buffer, folder, filename, resourceType = "image" } = params;

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: "upload",           // ✅ fuerza delivery normal
        access_mode: "public",    // ✅ fuerza acceso público
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },


      (error, result) => {
        if (error || !result) return reject(error || new Error("Upload failed"));
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          format: result.format,
          resource_type: result.resource_type,
        });
      }
    );

    stream.end(buffer);
  });
}

/**
 * Borra un asset en Cloudinary por publicId.
 */
export async function deleteFromCloudinary(params: {
  publicId: string;
  resourceType?: UploadResourceType | string | null; // por si viene null/undefined
}): Promise<{ result: string }> {
  const rt = (params.resourceType || "image") as UploadResourceType;

  const res = await cloudinary.uploader.destroy(params.publicId, {
    resource_type: rt,
    invalidate: true,
  });

  return { result: (res as any)?.result ?? "unknown" };
}
