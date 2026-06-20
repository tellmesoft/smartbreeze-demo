import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NuevoRepuestoButton } from "@/components/repuestos/nuevo-repuesto-button";
import {
  RepuestosStockMinimoAdminPanel,
  RepuestosStockMinimoInfo,
} from "@/components/repuestos/repuestos-stock-minimo-panel";
import {
  RepuestosWorkspace,
  type RepuestoRow,
} from "@/components/repuestos/repuestos-workspace";
import { MasterDetailPageSkeleton } from "@/components/ui/loading";
import { requireModule } from "@/lib/auth";
import { canCreateRepuesto } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getStockMinimoRepuestos } from "@/lib/repuestos-config";
import { formatDateTime } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function RepuestosPage({ searchParams }: Props) {
  const user = await requireModule("repuestos");
  const params = await searchParams;

  const [repuestos, equipos, proveedores, stockMinimo] = await Promise.all([
    prisma.repuesto.findMany({
      include: {
        equipo: true,
        proveedor: true,
        _count: { select: { movimientos: true } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.equipo.findMany({ orderBy: { codigoInterno: "asc" } }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" } }),
    getStockMinimoRepuestos(),
  ]);

  const items: RepuestoRow[] = await Promise.all(
    repuestos.map(async (r) => {
      const [ultimoPedido, ultimoIngreso] = await Promise.all([
        prisma.movimientoRepuesto.findFirst({
          where: { repuestoId: r.id, tipo: "PEDIDO" },
          orderBy: { fecha: "desc" },
          include: { registradoPor: { select: { nombre: true } } },
        }),
        prisma.movimientoRepuesto.findFirst({
          where: { repuestoId: r.id, tipo: "ENTRADA" },
          orderBy: { fecha: "desc" },
          include: { registradoPor: { select: { nombre: true } } },
        }),
      ]);

      return {
        id: r.id,
        codigoInterno: r.codigoInterno,
        nombre: r.nombre,
        descripcion: r.descripcion,
        tipo: r.tipo,
        cantidadDisponible: r.cantidadDisponible,
        cantidadMinima: r.cantidadMinima,
        cantidadPedida: r.cantidadPedida,
        costoUnitario: r.costoUnitario,
        proveedor: r.proveedor
          ? { id: r.proveedor.id, nombre: r.proveedor.nombre }
          : null,
        ubicacionAlmacen: r.ubicacionAlmacen,
        fotoBase64: r.fotoBase64,
        qrBase64: r.qrBase64,
        equipo: r.equipo
          ? {
              id: r.equipo.id,
              codigoInterno: r.equipo.codigoInterno,
              nombre: r.equipo.nombre,
            }
          : null,
        totalMovimientos: r._count.movimientos,
        ultimoPedidoPor: ultimoPedido?.registradoPor?.nombre ?? null,
        ultimoPedidoLabel: ultimoPedido ? formatDateTime(ultimoPedido.fecha) : null,
        ultimoPedidoCantidad: ultimoPedido?.cantidad ?? null,
        ultimoIngresoPor: ultimoIngreso?.registradoPor?.nombre ?? null,
        ultimoIngresoLabel: ultimoIngreso ? formatDateTime(ultimoIngreso.fecha) : null,
        ultimoIngresoCantidad: ultimoIngreso?.cantidad ?? null,
      };
    })
  );

  return (
    <div>
      <PageHeader
        title="Repuestos"
        toolbar={
          user.rol === "ADMINISTRADOR" ? (
            <RepuestosStockMinimoAdminPanel initialStockMinimo={stockMinimo} />
          ) : (
            <RepuestosStockMinimoInfo stockMinimo={stockMinimo} />
          )
        }
        action={
          canCreateRepuesto(user.rol) ? (
            <NuevoRepuestoButton
              stockMinimo={stockMinimo}
              equipos={equipos.map((e) => ({
                id: e.id,
                label: `${e.codigoInterno} — ${e.nombre}`,
              }))}
              proveedores={proveedores.map((p) => ({
                id: p.id,
                label: p.nombre,
              }))}
            />
          ) : undefined
        }
      />

      <Suspense fallback={<MasterDetailPageSkeleton />}>
        <RepuestosWorkspace
          items={items}
          stockMinimo={stockMinimo}
          userRol={user.rol as "ADMINISTRADOR" | "TECNICO"}
          selectedId={params.id}
        />
      </Suspense>
    </div>
  );
}
