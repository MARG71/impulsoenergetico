// src/app/api/leads/[id]/route.ts
export async function PATCH(req: Request, context: any) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const rol = (session.user as any).rol ?? (session.user as any).role ?? null;

    // ✅ Permitimos SUPERADMIN, ADMIN y AGENTE
    if (rol !== "SUPERADMIN" && rol !== "ADMIN" && rol !== "AGENTE") {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar este lead" },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id ? Number((session.user as any).id) : null;
    const adminId = (session.user as any).adminId ? Number((session.user as any).adminId) : null;
    const agenteId = (session.user as any).agenteId ? Number((session.user as any).agenteId) : null;

    const tenantAdminId =
      rol === "SUPERADMIN" ? null : rol === "ADMIN" ? userId : adminId;

    const id = Number(context?.params?.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID de lead no válido" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));

    const {
      estado,
      notas,
      proximaAccion,
      proximaAccionEn,
      comparativaId,
      contratoId,
    } = body as {
      estado?: string;
      notas?: string | null;
      proximaAccion?: string | null;
      proximaAccionEn?: string | null; // ISO
      comparativaId?: number | null;
      contratoId?: number | null;
    };

    const dataUpdate: any = {};

    if (estado) dataUpdate.estado = estado;
    if (typeof notas !== "undefined") dataUpdate.notas = notas || null;
    if (typeof proximaAccion !== "undefined")
      dataUpdate.proximaAccion = proximaAccion || null;

    if (typeof proximaAccionEn !== "undefined") {
      dataUpdate.proximaAccionEn = proximaAccionEn ? new Date(proximaAccionEn) : null;
    }

    if (typeof comparativaId !== "undefined") dataUpdate.comparativaId = comparativaId ?? null;
    if (typeof contratoId !== "undefined") dataUpdate.contratoId = contratoId ?? null;

    if (Object.keys(dataUpdate).length === 0) {
      return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 });
    }

    // ✅ Blindaje multi-tenant en update
    const where: any = { id };

    if (rol !== "SUPERADMIN") {
      if (!tenantAdminId) {
        return NextResponse.json({ error: "Tenant no resuelto" }, { status: 400 });
      }
      where.adminId = tenantAdminId;
    }

    if (rol === "AGENTE") where.agenteId = agenteId ?? -1;

    const updated = await prisma.lead.updateMany({
      where,
      data: dataUpdate,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "No encontrado o sin permisos" }, { status: 404 });
    }

    const leadActualizado = await prisma.lead.findFirst({
      where: { id },
      include: { agente: true, lugar: true },
    });

    return NextResponse.json(leadActualizado);
  } catch (error) {
    console.error("Error PATCH /api/leads/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el lead" },
      { status: 500 }
    );
  }
}
