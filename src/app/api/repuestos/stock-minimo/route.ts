import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireSessionApi } from "@/lib/auth";
import { getStockMinimoRepuestos, setStockMinimoRepuestos } from "@/lib/repuestos-config";

export async function GET() {
  const user = await requireSessionApi(["ADMINISTRADOR", "TECNICO"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const stockMinimo = await getStockMinimoRepuestos();
  return NextResponse.json({ stockMinimo });
}

export async function PATCH(request: Request) {
  const user = await requireSessionApi(["ADMINISTRADOR"]);
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const stockMinimo = Number(body.stockMinimo);

    if (Number.isNaN(stockMinimo) || stockMinimo < 0) {
      return NextResponse.json({ error: "Indicá un stock mínimo válido." }, { status: 400 });
    }

    const value = await setStockMinimoRepuestos(stockMinimo);

    revalidatePath("/repuestos");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return NextResponse.json({ stockMinimo: value });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el stock mínimo." }, { status: 500 });
  }
}
