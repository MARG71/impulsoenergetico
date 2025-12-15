import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { Buffer } from "buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  cliente: {
    nombre: string;
    direccion: string;
    cups?: string;
    fechaInicio?: string;
    fechaFin?: string;
  };
  oferta: {
    compania: string;
    tarifa: string;
    nombreTarifa?: string;
    anexoPrecios?: string; // texto (resumen) o lo que ya tengas
    costeEstimado?: string; // "58.87 €"
    ahorro?: string;        // "82.33 €"
    comision?: string;      // "12.96 €"
    idOferta?: string | number;
  };
};

function safeText(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

// Helper para “sanear” valores en nombres de archivo
function safe(v: any) {
  return String(v ?? "")
    .trim()
    .replace(/[^\w\-]+/g, "_"); // deja letras/números/_/-
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Payload;

    // 1) Crear PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 (pt)
    const { width, height } = page.getSize();

    // 2) Fuentes
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 3) Logo (desde /public/logo-impulso.png)
    // Asegúrate de que existe: /public/logo-impulso.png
    const logoPath = path.join(process.cwd(), "public", "logo-impulso.png");
    let logoImage: any = null;

    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    }

    // ====== ESTILO FACTURA / OFERTA ======
    // Colores
    const cDark = rgb(0.06, 0.1, 0.16);
    const cGray = rgb(0.35, 0.4, 0.48);
    const cLine = rgb(0.85, 0.88, 0.92);

    const margin = 40;

    // Cabecera
    page.drawRectangle({
      x: 0,
      y: height - 110,
      width,
      height: 110,
      color: rgb(0.95, 0.97, 0.99),
    });

    if (logoImage) {
      const logoW = 140;
      const logoH = (logoImage.height / logoImage.width) * logoW;
      page.drawImage(logoImage, {
        x: margin,
        y: height - 80,
        width: logoW,
        height: logoH,
      });
    } else {
      page.drawText("IMPULSO ENERGÉTICO", {
        x: margin,
        y: height - 55,
        size: 16,
        font: fontBold,
        color: cDark,
      });
    }

    // Título derecha
    page.drawText("OFERTA / DETALLE DE CONTRATACIÓN", {
      x: width - margin - 260,
      y: height - 45,
      size: 12,
      font: fontBold,
      color: cDark,
    });

    const ofertaId = safeText(payload?.oferta?.idOferta);
    page.drawText(`Ref: ${ofertaId || "-"}`, {
      x: width - margin - 260,
      y: height - 65,
      size: 10,
      font,
      color: cGray,
    });

    // Línea separadora
    page.drawLine({
      start: { x: margin, y: height - 120 },
      end: { x: width - margin, y: height - 120 },
      thickness: 1,
      color: cLine,
    });

    // Bloques: Cliente / Oferta
    const boxY = height - 180;

    // Caja Cliente
    page.drawText("DATOS DEL CLIENTE", {
      x: margin,
      y: boxY,
      size: 11,
      font: fontBold,
      color: cDark,
    });

    const clienteNombre = safeText(payload?.cliente?.nombre);
    const clienteDir = safeText(payload?.cliente?.direccion);
    const cups = safeText(payload?.cliente?.cups);

    page.drawText(`Nombre: ${clienteNombre || "-"}`, {
      x: margin,
      y: boxY - 18,
      size: 10,
      font,
      color: cDark,
    });

    page.drawText(`Dirección: ${clienteDir || "-"}`, {
      x: margin,
      y: boxY - 34,
      size: 10,
      font,
      color: cDark,
    });

    if (cups) {
      page.drawText(`CUPS: ${cups}`, {
        x: margin,
        y: boxY - 50,
        size: 10,
        font,
        color: cDark,
      });
    }

    // Caja Oferta
    const rightX = width / 2 + 10;
    page.drawText("DATOS DE LA OFERTA", {
      x: rightX,
      y: boxY,
      size: 11,
      font: fontBold,
      color: cDark,
    });

    const compania = safeText(payload?.oferta?.compania);
    const tarifa = safeText(payload?.oferta?.tarifa);
    const nombreTarifa = safeText(payload?.oferta?.nombreTarifa);

    page.drawText(`Compañía: ${compania || "-"}`, {
      x: rightX,
      y: boxY - 18,
      size: 10,
      font,
      color: cDark,
    });

    page.drawText(`Tarifa: ${tarifa || "-"}`, {
      x: rightX,
      y: boxY - 34,
      size: 10,
      font,
      color: cDark,
    });

    if (nombreTarifa) {
      page.drawText(`Nombre tarifa: ${nombreTarifa}`, {
        x: rightX,
        y: boxY - 50,
        size: 10,
        font,
        color: cDark,
      });
    }

    // Tabla resumen (coste/ahorro/comisión)
    const tableTop = height - 300;

    page.drawText("RESUMEN ECONÓMICO (ESTIMADO)", {
      x: margin,
      y: tableTop,
      size: 11,
      font: fontBold,
      color: cDark,
    });

    // Encabezado tabla
    page.drawRectangle({
      x: margin,
      y: tableTop - 35,
      width: width - margin * 2,
      height: 22,
      color: rgb(0.93, 0.96, 1),
    });

    page.drawText("Coste estimado", { x: margin + 10, y: tableTop - 28, size: 10, font: fontBold, color: cDark });
    page.drawText("Ahorro",         { x: margin + 220, y: tableTop - 28, size: 10, font: fontBold, color: cDark });
    page.drawText("Comisión",       { x: margin + 360, y: tableTop - 28, size: 10, font: fontBold, color: cDark });

    const coste = safeText(payload?.oferta?.costeEstimado) || "-";
    const ahorro = safeText(payload?.oferta?.ahorro) || "-";
    const comision = safeText(payload?.oferta?.comision) || "-";

    page.drawText(coste,   { x: margin + 10,  y: tableTop - 55, size: 11, font, color: cDark });
    page.drawText(ahorro,  { x: margin + 220, y: tableTop - 55, size: 11, font, color: cDark });
    page.drawText(comision,{ x: margin + 360, y: tableTop - 55, size: 11, font, color: cDark });

    // Anexo de precios / condiciones
    const anexoTop = tableTop - 110;
    page.drawText("ANEXO DE PRECIOS / CONDICIONES", {
      x: margin,
      y: anexoTop,
      size: 11,
      font: fontBold,
      color: cDark,
    });

    const anexo = safeText(payload?.oferta?.anexoPrecios) || "No se ha definido un anexo de precios para esta oferta.";

    // Texto multilínea simple
    const maxWidth = width - margin * 2;
    const lines = wrapText(anexo, 95); // aprox
    let y = anexoTop - 20;

    page.drawRectangle({
      x: margin,
      y: 120,
      width: maxWidth,
      height: (anexoTop - 30) - 120,
      borderWidth: 1,
      borderColor: cLine,
      color: rgb(1, 1, 1),
    });

    for (const line of lines.slice(0, 28)) {
      if (y < 140) break;
      page.drawText(line, { x: margin + 10, y, size: 9.5, font, color: cGray });
      y -= 14;
    }

    // Footer
    page.drawLine({
      start: { x: margin, y: 90 },
      end: { x: width - margin, y: 90 },
      thickness: 1,
      color: cLine,
    });

    page.drawText("Impulso Energético · Documento informativo no vinculante · Soporte: info@impulsoenergetico.es", {
      x: margin,
      y: 70,
      size: 9,
      font,
      color: cGray,
    });

    // 4) Responder PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);


    return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="oferta_${safe(ofertaId)}_${safe(clienteNombre).replace(/\s+/g, "_")}.pdf"`,
    },
    });


  } catch (err: any) {
    console.error("POST /api/oferta-pdf", err);
    return NextResponse.json(
      { error: "No se pudo generar el PDF.", detail: err?.message || String(err) },
      { status: 500 }
    );
  }
}

// Ajuste simple de texto a líneas
function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}
