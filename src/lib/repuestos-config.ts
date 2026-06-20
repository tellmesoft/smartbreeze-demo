import { prisma } from "@/lib/prisma";

export const DEFAULT_STOCK_MINIMO_REPUESTOS = 3;

export async function getStockMinimoRepuestos(): Promise<number> {
  const row = await prisma.configuracionApp.upsert({
    where: { id: "default" },
    create: { id: "default", stockMinimoRepuestos: DEFAULT_STOCK_MINIMO_REPUESTOS },
    update: {},
    select: { stockMinimoRepuestos: true },
  });

  return row.stockMinimoRepuestos;
}

export async function setStockMinimoRepuestos(stockMinimo: number): Promise<number> {
  const row = await prisma.configuracionApp.upsert({
    where: { id: "default" },
    create: { id: "default", stockMinimoRepuestos: stockMinimo },
    update: { stockMinimoRepuestos: stockMinimo },
  });

  await prisma.repuesto.updateMany({
    data: { cantidadMinima: stockMinimo },
  });

  return row.stockMinimoRepuestos;
}
