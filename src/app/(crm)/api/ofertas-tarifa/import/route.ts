import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// (opcional) si el Excel pudiese tardar: export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const tipoGlobal = ((formData.get('tipo') as string) || 'LUZ').toUpperCase()
    const subtipoGlobal = (formData.get('subtipo') as string | null) || null
    const replace = formData.get('replace') === 'true'
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Falta el fichero Excel' }, { status: 400 })
    }

    // Validación básica de extensión
    const filename = (file as any).name || 'archivo.xlsx'
    if (!/\.(xlsx|xls)$/i.test(filename)) {
      return NextResponse.json({ error: 'Formato no soportado. Sube un .xlsx o .xls' }, { status: 400 })
    }

    const arrayBuf = await file.arrayBuffer()
    const buf = Buffer.from(arrayBuf)

    let wb: XLSX.WorkBook
    try {
      wb = XLSX.read(buf, { type: 'buffer' })
    } catch (e: any) {
      console.error('XLSX.read error:', e)
      return NextResponse.json({ error: 'No se pudo leer el Excel. Revisa el formato.' }, { status: 400 })
    }

    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) {
      return NextResponse.json({ error: 'El Excel no tiene hojas' }, { status: 400 })
    }

    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null })
    if (!rows.length) {
      return NextResponse.json({ error: 'El Excel está vacío' }, { status: 400 })
    }

    const getNum = (v: any) => (v === null || v === '' || isNaN(Number(v))) ? null : Number(v)
    const getInt = (v: any) => (v === null || v === '' || isNaN(Number(v))) ? null : Math.round(Number(v))
    const pick = (r: any, keys: string[], def: any = null) => { for (const k of keys) if (r[k] != null && r[k] !== '') return r[k]; return def }
    const getStr = (r: any, keys: string[], def = '') => String(pick(r, keys, def) ?? '').trim()

    if (replace && subtipoGlobal) {
      await prisma.ofertaTarifa.deleteMany({ where: { tipo: tipoGlobal as any, subtipo: subtipoGlobal } })
    }

    type Key = string
    const group: Record<Key, { base: any, tramos: any[] }> = {}

    for (const r of rows) {
      const tipo = (getStr(r, ['tipo','Tipo'], tipoGlobal) || 'LUZ').toUpperCase()
      const subtipo = getStr(r, ['subtipo','Subtipo','tarifa','Tarifa'], subtipoGlobal || '2.0TD')

      const compania = getStr(r, ['compania','compañia','Company','COMPAÑIA','Compañia'], 'N/D')
      const anexoRaw = getStr(r, ['anexo','anexoPrecio','Anexo','Anexo Precio'], '')
      const anexo = anexoRaw || null
      const nombre = getStr(r, ['nombre','Nombre','nombre_tarifa','Nombre tarifa','Tarifa'], subtipo)
      const descripcion = getStr(r, ['descripcion','Descripción','descripcion_oferta','Descripción oferta'], '')

      const p1 = getNum(pick(r, ['precio_kwh_p1','P1','Precio P1','precio P1']))
      const p2 = getNum(pick(r, ['precio_kwh_p2','P2','Precio P2','precio P2']))
      const p3 = getNum(pick(r, ['precio_kwh_p3','P3','Precio P3','precio P3']))
      const p4 = getNum(pick(r, ['precio_kwh_p4','P4','Precio P4','precio P4']))
      const p5 = getNum(pick(r, ['precio_kwh_p5','P5','Precio P5','precio P5']))
      const p6 = getNum(pick(r, ['precio_kwh_p6','P6','Precio P6','precio P6']))

      const comBase = getNum(pick(r, ['comision_kwh_admin_base','comision_kwh_admin','comisión_kwh_admin','comision €/kWh','comisión €/kWh']))

      const cDesde = getInt(pick(r, ['consumo_desde_kwh','consumo_desde','consumo_desde_mensual']))
      const cHasta = getInt(pick(r, ['consumo_hasta_kwh','consumo_hasta','consumo_hasta_mensual']))
      const consumoEsMensual = !!r['consumo_desde_mensual'] || !!r['consumo_hasta_mensual']
      const consumoDesdeKWh = cDesde == null ? 0 : (consumoEsMensual ? cDesde * 12 : cDesde)
      const consumoHastaKWh = cHasta == null ? null : (consumoEsMensual ? cHasta * 12 : cHasta)

      const comTramoKwh = getNum(pick(r, ['comision_kwh_admin_tramo','comision_kwh_admin','comisión_kwh_admin_tramo']))
      const comTramoFija = getNum(pick(r, ['comision_fija_admin','comision_admin_fija','comisión fija admin']))

      const pctCliente = getNum(pick(r, ['pct_cliente','pctCliente']))
      const pctLugar   = getNum(pick(r, ['pct_lugar','pctLugar']))
      const pctAgente  = getNum(pick(r, ['pct_agente','pctAgente']))

      const key = JSON.stringify([tipo, subtipo, compania, nombre, anexo])

      if (!group[key]) {
        group[key] = {
          base: {
            tipo, subtipo, compania, anexoPrecio: anexo || null, nombre, descripcion,
            precioKwhP1: p1, precioKwhP2: p2, precioKwhP3: p3,
            precioKwhP4: p4, precioKwhP5: p5, precioKwhP6: p6,
            comisionKwhAdminBase: comBase,
            payload: null,
            activa: true,
            destacada: false,
          },
          tramos: [],
        }
      }

      if (consumoDesdeKWh != null || consumoHastaKWh != null || comTramoKwh != null || comTramoFija != null) {
        group[key].tramos.push({
          consumoDesdeKWh: consumoDesdeKWh ?? 0,
          consumoHastaKWh: consumoHastaKWh,
          comisionKwhAdmin: comTramoKwh,
          comisionFijaAdmin: comTramoFija,
          pctCliente: pctCliente ?? null,
          pctLugar: pctLugar ?? null,
          pctAgente: pctAgente ?? null,
          activo: true,
          notas: null,
        })
      }
    }

    const upserts = await prisma.$transaction(
      Object.keys(group).map((key) => {
        const g = group[key]
        return prisma.ofertaTarifa.upsert({
          where: {
            // @@unique([tipo, subtipo, compania, nombre, anexoPrecio])
            // @ts-ignore
            tipo_subtipo_compania_nombre_anexoPrecio: {
              tipo: g.base.tipo,
              subtipo: g.base.subtipo,
              compania: g.base.compania,
              nombre: g.base.nombre,
              anexoPrecio: g.base.anexoPrecio,
            }
          },
          update: {
            descripcion: g.base.descripcion,
            activa: true,
            precioKwhP1: g.base.precioKwhP1,
            precioKwhP2: g.base.precioKwhP2,
            precioKwhP3: g.base.precioKwhP3,
            precioKwhP4: g.base.precioKwhP4,
            precioKwhP5: g.base.precioKwhP5,
            precioKwhP6: g.base.precioKwhP6,
            comisionKwhAdminBase: g.base.comisionKwhAdminBase,
            payload: g.base.payload,
            tramos: { deleteMany: {} },
          },
          create: { ...g.base }
        })
      })
    )

    const tramoCreates: any[] = []
    for (const up of upserts) {
      const k = JSON.stringify([up.tipo, up.subtipo, up.compania, up.nombre, up.anexoPrecio])
      const g = group[k]
      if (!g) continue
      for (const t of g.tramos) {
        tramoCreates.push(prisma.ofertaTarifaTramo.create({
          data: { ...t, ofertaTarifaId: up.id }
        }))
      }
    }
    if (tramoCreates.length > 0) await prisma.$transaction(tramoCreates)

    return NextResponse.json({ ofertas: upserts.length, tramos: tramoCreates.length })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json({ error: err?.message || 'Error interno importando Excel' }, { status: 500 })
  }
}
