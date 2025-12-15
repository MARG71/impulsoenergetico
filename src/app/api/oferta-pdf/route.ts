import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";
import { Buffer } from "buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EnergiaPotenciaMap = Partial<Record<"P1"|"P2"|"P3"|"P4"|"P5"|"P6", number>>;

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
    anexoPrecios?: string;
    costeEstimado?: string;
    ahorro?: string;
    comision?: string;
    idOferta?: string | number;
  };
  // ✅ NUEVO: desglose tipo factura
  detalle?: {
    diasFactura?: number;

    periodosConsumo?: Array<"P1"|"P2"|"P3"|"P4"|"P5"|"P6">;
    periodosPotencia?: Array<"P1"|"P2"|"P3"|"P4"|"P5"|"P6">;

    consumoPeriodos?: EnergiaPotenciaMap;  // kWh
    potencias?: EnergiaPotenciaMap;        // kW

    precioEnergia?: EnergiaPotenciaMap;    // €/kWh
    precioPotencia?: EnergiaPotenciaMap;   // €/kW·año

    costeEnergia?: number;
    costePotencia?: number;

    impuestoElectricidadPct?: number;      // ej 5.113
    impuestoElectricidadImporte?: number;

    alquiler?: number;
    reactiva?: number;
    exceso?: number;
    otros?: number;

    subtotalAntesIVA?: number;
    ivaPct?: number;                       // ej 21
    ivaImporte?: number;

    total?: number;

    facturaActual?: number; // opcional si quieres mostrarlo
    ahorro?: number;
    ahorroPct?: number;
  };
};

function safeText(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function safe(v: any) {
  return String(v ?? "").trim().replace(/[^\w\-]+/g, "_");
}

function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function eur(value: any) {
  const num = n(value);
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(num);
}

function num(value: any, dec = 2) {
  const x = n(value);
  return new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(x);
}

function pct(value: any, dec = 3) {
  const x = n(value);
  return new Intl.NumberFormat("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(x) + " %";
}

function formatDateISO(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES").format(d);
}

function line(page: any, x1: number, y1: number, x2: number, y2: number, color = rgb(0.88, 0.9, 0.93)) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 1, color });
}

function box(page: any, x: number, y: number, w: number, h: number, border = rgb(0.88, 0.9, 0.93), fill = rgb(1,1,1)) {
  page.drawRectangle({ x, y, width: w, height: h, borderWidth: 1, borderColor: border, color: fill });
}

function sectionTitle(page: any, text: string, x: number, y: number, fontBold: any) {
  page.drawText(text, { x, y, size: 10.5, font: fontBold, color: rgb(0.08, 0.12, 0.18) });
}

function kv(page: any, label: string, value: string, x: number, y: number, font: any, fontBold: any, valueRightX?: number) {
  page.drawText(label, { x, y, size: 9.6, font: fontBold, color: rgb(0.25, 0.3, 0.38) });
  if (valueRightX) {
    const w = font.widthOfTextAtSize(value, 9.6);
    page.drawText(value, { x: valueRightX - w, y, size: 9.6, font, color: rgb(0.06, 0.1, 0.16) });
  } else {
    page.drawText(value, { x: x + 140, y, size: 9.6, font, color: rgb(0.06, 0.1, 0.16) });
  }
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Payload;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Logo
    const logoPath = path.join(process.cwd(), "public", "logo-impulso.png");
    let logoImage: any = null;
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    }

    const margin = 38;
    const cDark = rgb(0.06, 0.1, 0.16);
    const cGray = rgb(0.35, 0.4, 0.48);
    const cLine = rgb(0.88, 0.9, 0.93);
    const cSoft = rgb(0.95, 0.97, 0.99);
    const cAccent = rgb(0.10, 0.70, 0.55); // verde suave

    // ===== CABECERA =====
    page.drawRectangle({ x: 0, y: height - 118, width, height: 118, color: cSoft });

    if (logoImage) {
      const logoW = 150;
      const logoH = (logoImage.height / logoImage.width) * logoW;
      page.drawImage(logoImage, { x: margin, y: height - 92, width: logoW, height: logoH });
    } else {
      page.drawText("IMPULSO ENERGÉTICO", { x: margin, y: height - 55, size: 16, font: fontBold, color: cDark });
    }

    const ofertaId = safeText(payload?.oferta?.idOferta);
    const fechaEmision = new Intl.DateTimeFormat("es-ES").format(new Date());

    page.drawText("OFERTA / FACTURA ESTIMADA DE SUMINISTRO ELÉCTRICO", {
      x: width - margin - 320,
      y: height - 44,
      size: 11,
      font: fontBold,
      color: cDark,
    });
    page.drawText(`Referencia: ${ofertaId || "-"}`, {
      x: width - margin - 320,
      y: height - 62,
      size: 9.5,
      font,
      color: cGray,
    });
    page.drawText(`Fecha de emisión: ${fechaEmision}`, {
      x: width - margin - 320,
      y: height - 78,
      size: 9.5,
      font,
      color: cGray,
    });

    line(page, margin, height - 122, width - margin, height - 122, cLine);

    // ===== BLOQUES CLIENTE / OFERTA =====
    const topY = height - 168;
    const colW = (width - margin * 2 - 12) / 2;

    box(page, margin, topY - 86, colW, 86, cLine, rgb(1, 1, 1));
    box(page, margin + colW + 12, topY - 86, colW, 86, cLine, rgb(1, 1, 1));

    sectionTitle(page, "DATOS DEL CLIENTE", margin + 12, topY - 18, fontBold);
    const clienteNombre = safeText(payload?.cliente?.nombre) || "-";
    const clienteDir = safeText(payload?.cliente?.direccion) || "-";
    const cups = safeText(payload?.cliente?.cups);

    kv(page, "Nombre", clienteNombre, margin + 12, topY - 36, font, fontBold);
    kv(page, "Dirección", clienteDir, margin + 12, topY - 52, font, fontBold);
    if (cups) kv(page, "CUPS", cups, margin + 12, topY - 68, font, fontBold);

    sectionTitle(page, "DATOS DE LA OFERTA", margin + colW + 24, topY - 18, fontBold);
    const compania = safeText(payload?.oferta?.compania) || "-";
    const tarifa = safeText(payload?.oferta?.tarifa) || "-";
    const nombreTarifa = safeText(payload?.oferta?.nombreTarifa);

    kv(page, "Compañía", compania, margin + colW + 24, topY - 36, font, fontBold);
    kv(page, "Tarifa", tarifa, margin + colW + 24, topY - 52, font, fontBold);
    if (nombreTarifa) kv(page, "Nombre tarifa", nombreTarifa, margin + colW + 24, topY - 68, font, fontBold);

    // Periodo facturación (si viene)
    const fi = safeText(payload?.cliente?.fechaInicio);
    const ff = safeText(payload?.cliente?.fechaFin);
    if (fi || ff) {
      page.drawText(`Periodo estimado: ${formatDateISO(fi) || "-"}  a  ${formatDateISO(ff) || "-"}`, {
        x: margin,
        y: topY - 104,
        size: 9.2,
        font,
        color: cGray,
      });
    }

    // ===== DESGLOSE ECONÓMICO =====
    let y = topY - 130;

    sectionTitle(page, "DESGLOSE ECONÓMICO (ESTIMADO)", margin, y, fontBold);
    y -= 10;
    line(page, margin, y, width - margin, y, cLine);
    y -= 14;

    const detalle = payload.detalle || {};
    const right = width - margin;

    const diasFactura = detalle.diasFactura ?? 30;

    // A) POTENCIA
    page.drawText("A) TÉRMINO DE POTENCIA", { x: margin, y, size: 10, font: fontBold, color: cDark });
    y -= 14;

    const periodosPot = detalle.periodosPotencia || ["P1", "P2"];
    const potencias = detalle.potencias || {};
    const precioPot = detalle.precioPotencia || {};
    for (const p of periodosPot) {
      const kw = n(potencias[p]);
      const eurKwAnyo = n(precioPot[p]);
      const txt = `• ${p}: ${num(kw, 2)} kW  ×  ${num(eurKwAnyo, 6)} €/kW·año`;
      page.drawText(txt, { x: margin + 12, y, size: 9.2, font, color: cGray });
      y -= 12;
    }
    const costePotencia = n(detalle.costePotencia);
    kv(page, "Coste término potencia", eur(costePotencia), margin + 12, y, font, fontBold, right);
    y -= 16;

    // B) ENERGÍA
    page.drawText("B) TÉRMINO DE ENERGÍA", { x: margin, y, size: 10, font: fontBold, color: cDark });
    y -= 14;

    const periodosCon = detalle.periodosConsumo || ["P1", "P2", "P3"];
    const consumos = detalle.consumoPeriodos || {};
    const precioEn = detalle.precioEnergia || {};

    for (const p of periodosCon) {
      const kwh = n(consumos[p]);
      const eurKwh = n(precioEn[p]);
      const subtotal = kwh * eurKwh;
      const txt = `• ${p}: ${num(kwh, 2)} kWh × ${num(eurKwh, 6)} €/kWh = ${eur(subtotal)}`;
      page.drawText(txt, { x: margin + 12, y, size: 9.2, font, color: cGray });
      y -= 12;
    }
    const costeEnergia = n(detalle.costeEnergia);
    kv(page, "Coste término energía", eur(costeEnergia), margin + 12, y, font, fontBold, right);
    y -= 16;

    // C) IMPUESTO ELECTRICIDAD
    page.drawText("C) IMPUESTO SOBRE LA ELECTRICIDAD", { x: margin, y, size: 10, font: fontBold, color: cDark });
    y -= 14;

    const base = costeEnergia + costePotencia;
    const impPct = n(detalle.impuestoElectricidadPct);
    const impImporte = n(detalle.impuestoElectricidadImporte);

    page.drawText(`Base imponible (Energía + Potencia): ${eur(base)}`, { x: margin + 12, y, size: 9.2, font, color: cGray });
    y -= 12;
    page.drawText(`Tipo impositivo: ${pct(impPct, 3)}`, { x: margin + 12, y, size: 9.2, font, color: cGray });
    y -= 12;
    kv(page, "Importe impuesto electricidad", eur(impImporte), margin + 12, y, font, fontBold, right);
    y -= 16;

    // D) OTROS CONCEPTOS
    page.drawText("D) OTROS CONCEPTOS", { x: margin, y, size: 10, font: fontBold, color: cDark });
    y -= 14;

    const alquiler = n(detalle.alquiler);
    const reactiva = n(detalle.reactiva);
    const exceso = n(detalle.exceso);
    const otros = n(detalle.otros);

    kv(page, "Alquiler contador", eur(alquiler), margin + 12, y, font, fontBold, right); y -= 12;
    kv(page, "Energía reactiva", eur(reactiva), margin + 12, y, font, fontBold, right); y -= 12;
    kv(page, "Excesos de potencia", eur(exceso), margin + 12, y, font, fontBold, right); y -= 12;
    kv(page, "Otros conceptos", eur(otros), margin + 12, y, font, fontBold, right); y -= 16;

    // SUBTOTAL + IVA + TOTAL
    line(page, margin, y, width - margin, y, cLine);
    y -= 14;

    const subtotalAntesIVA = n(detalle.subtotalAntesIVA);
    const ivaPct = n(detalle.ivaPct);
    const ivaImporte = n(detalle.ivaImporte);
    const total = n(detalle.total);

    kv(page, "Subtotal antes de IVA", eur(subtotalAntesIVA), margin, y, font, fontBold, right);
    y -= 14;
    kv(page, `IVA (${pct(ivaPct, 0)})`, eur(ivaImporte), margin, y, font, fontBold, right);
    y -= 18;

    // TOTAL destacado
    page.drawRectangle({
      x: margin,
      y: y - 6,
      width: width - margin * 2,
      height: 34,
      color: rgb(0.93, 0.98, 0.96),
      borderWidth: 1,
      borderColor: rgb(0.78, 0.92, 0.86),
    });
    page.drawText("IMPORTE TOTAL ESTIMADO", {
      x: margin + 12,
      y: y + 12,
      size: 10,
      font: fontBold,
      color: cDark,
    });
    const totalTxt = eur(total);
    const totalW = fontBold.widthOfTextAtSize(totalTxt, 14);
    page.drawText(totalTxt, {
      x: width - margin - 12 - totalW,
      y: y + 9,
      size: 14,
      font: fontBold,
      color: cAccent,
    });
    y -= 46;

    // Comparativa / Ahorro
    const ahorro = n(detalle.ahorro ?? payload.oferta.ahorro);
    const ahorroPct = n(detalle.ahorroPct);
    const facturaActual = n(detalle.facturaActual);

    sectionTitle(page, "COMPARATIVA Y AHORRO", margin, y, fontBold);
    y -= 10;
    line(page, margin, y, width - margin, y, cLine);
    y -= 14;

    if (facturaActual > 0) {
      kv(page, "Factura actual (aportada)", eur(facturaActual), margin, y, font, fontBold, right);
      y -= 12;
    }
    kv(page, "Coste con esta oferta", eur(total), margin, y, font, fontBold, right);
    y -= 12;

    const ahorroTxt = ahorroPct > 0 ? `${eur(ahorro)}  (${num(ahorroPct,0)}%)` : eur(ahorro);
    kv(page, "Ahorro estimado", ahorroTxt, margin, y, font, fontBold, right);
    y -= 18;

    // Anexo/condiciones (si hay espacio)
    const anexo = safeText(payload?.oferta?.anexoPrecios) || "Precios sujetos a validación final por la comercializadora. Estimación basada en los datos introducidos por el cliente y el periodo indicado.";
    sectionTitle(page, "ANEXO DE PRECIOS / CONDICIONES", margin, y, fontBold);
    y -= 10;

    const anexoBoxH = 112;
    box(page, margin, y - anexoBoxH, width - margin * 2, anexoBoxH, cLine, rgb(1,1,1));

    const lines = wrapText(anexo, 102);
    let ty = y - 16;
    for (const l of lines.slice(0, 7)) {
      page.drawText(l, { x: margin + 12, y: ty, size: 9.2, font, color: cGray });
      ty -= 12;
    }

    // Footer
    line(page, margin, 86, width - margin, 86, cLine);
    page.drawText(
      "Impulso Energético · Documento informativo no vinculante. No sustituye a la factura oficial de la comercializadora.",
      { x: margin, y: 66, size: 8.8, font, color: cGray }
    );
    page.drawText("Soporte: info@impulsoenergetico.es", { x: margin, y: 52, size: 8.8, font, color: cGray });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const filename = `oferta_${safe(ofertaId)}_${safe(clienteNombre).replace(/\s+/g, "_")}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
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
