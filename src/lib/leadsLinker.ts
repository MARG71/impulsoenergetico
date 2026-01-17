import { prisma } from "@/lib/prisma";

/**
 * Normaliza teléfono: quita espacios, guiones, prefijos raros.
 * Mantiene dígitos. (Suficiente para España y la mayoría de casos)
 */
function normalizarTelefono(t?: string | null) {
  if (!t) return "";
  return String(t).replace(/[^\d]/g, "");
}

function normalizarEmail(e?: string | null) {
  if (!e) return "";
  return String(e).trim().toLowerCase();
}

/**
 * Resuelve adminId (tenant) a partir de lugar/agente, para soportar
 * comparador público SIN sesión.
 */
export async function resolverAdminIdDesdeOrigen(params: {
  lugarId?: number | null;
  agenteId?: number | null;
}) {
  const { lugarId, agenteId } = params;

  if (lugarId) {
    const lugar = await prisma.lugar.findUnique({
      where: { id: lugarId },
      select: { adminId: true, agenteId: true },
    });
    if (lugar?.adminId) return lugar.adminId;
    // fallback: agente del lugar
    if (lugar?.agenteId) {
      const agente = await prisma.agente.findUnique({
        where: { id: lugar.agenteId },
        select: { adminId: true },
      });
      if (agente?.adminId) return agente.adminId;
    }
  }

  if (agenteId) {
    const agente = await prisma.agente.findUnique({
      where: { id: agenteId },
      select: { adminId: true },
    });
    if (agente?.adminId) return agente.adminId;
  }

  return null;
}

/**
 * Busca y enlaza el lead más reciente por email/teléfono dentro del tenant.
 * - Actualiza estado: "comparativa" o "contrato"
 * - Completa agenteId/lugarId del lead si venían vacíos
 */
export async function enlazarLeadPorContacto(params: {
  adminId: number | null; // tenant adminId (NO superadmin)
  email?: string | null;
  telefono?: string | null;
  estadoDestino: "comparativa" | "contrato";
  agenteId?: number | null;
  lugarId?: number | null;
}) {
  const { adminId, email, telefono, estadoDestino, agenteId, lugarId } = params;

  if (!adminId) return { updated: false, reason: "Sin adminId (tenant)" };

  const emailN = normalizarEmail(email);
  const telN = normalizarTelefono(telefono);

  if (!emailN && !telN) return { updated: false, reason: "Sin email/teléfono" };

  // Construimos OR por email/teléfono
  const or: any[] = [];
  if (emailN) or.push({ email: emailN });
  if (telN) or.push({ telefono: telN });

  // Buscamos el lead más reciente del tenant
  const lead = await prisma.lead.findFirst({
    where: {
      adminId,
      OR: or,
    },
    orderBy: { creadoEn: "desc" },
  });

  if (!lead) return { updated: false, reason: "No se encontró lead" };

  // Si ya estaba en un estado "más avanzado", no lo bajamos
  const orden: Record<string, number> = {
    pendiente: 1,
    contactado: 2,
    comparativa: 3,
    contrato: 4,
    cerrado: 5,
    perdido: 0,
  };
  const actual = (lead.estado || "pendiente").toLowerCase();
  const nuevo = estadoDestino;

  if ((orden[actual] ?? 1) >= (orden[nuevo] ?? 1)) {
    // Aún así podemos completar agente/lugar si faltan
    const dataPatch: any = {};
    if (!lead.agenteId && agenteId) dataPatch.agenteId = agenteId;
    if (!lead.lugarId && lugarId) dataPatch.lugarId = lugarId;

    if (Object.keys(dataPatch).length > 0) {
      await prisma.lead.update({ where: { id: lead.id }, data: dataPatch });
      return { updated: true, leadId: lead.id, reason: "Completado agente/lugar" };
    }

    return { updated: false, reason: "Lead ya avanzado" };
  }

  const dataUpdate: any = {
    estado: estadoDestino,
  };

  if (!lead.agenteId && agenteId) dataUpdate.agenteId = agenteId;
  if (!lead.lugarId && lugarId) dataUpdate.lugarId = lugarId;

  await prisma.lead.update({
    where: { id: lead.id },
    data: dataUpdate,
  });

  return { updated: true, leadId: lead.id, reason: "Estado actualizado" };
}
