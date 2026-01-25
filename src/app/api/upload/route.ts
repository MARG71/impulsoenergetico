import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs"; // Cloudinary necesita Node runtime

type Rol = "SUPERADMIN" | "ADMIN" | "AGENTE" | "LUGAR" | "CLIENTE";

function guessResourceType(mime: string): "image" | "video" | "raw" {
  if (!mime) return "image";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  // PDFs u otros => raw
  return "raw";
}

export async function POST(req: NextRequest) {
  try {
    // 1) Auth + role
    const token = await getToken({ req });
    const role = (token as any)?.role as Rol | undefined;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (role !== "SUPERADMIN" && role !== "ADMIN" && role !== "AGENTE" && role !== "LUGAR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }


    // 2) FormData
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string | null) ?? "impulso/misc";
    const forcedResourceType = (form.get("resourceType") as string | null) ?? null;

    if (!file) {
      return NextResponse.json({ error: "Falta el archivo (file)" }, { status: 400 });
    }

    // 3) Convert file -> Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resourceType =
      (forcedResourceType as any) || guessResourceType(file.type);

    // 4) Upload
    const result = await uploadBufferToCloudinary({
      buffer,
      folder,
      filename: file.name,
      resourceType,
      deliveryType: "authenticated",
      accessMode: "authenticated",
    });


    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
      mime: file.type,
      folder,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: "Error subiendo a Cloudinary", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
