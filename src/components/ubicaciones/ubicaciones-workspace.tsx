"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MasterDetailBack } from "@/components/layout/master-detail-back";
import { UbicacionesSidebar, type UbicacionListItem } from "@/components/ubicaciones/ubicaciones-sidebar";
import { UbicacionDetail, type UbicacionDetailData } from "@/components/ubicaciones/ubicacion-detail";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Props = {
  ubicaciones: UbicacionListItem[];
  facultades: string[];
  selectedFacultad?: string;
  selectedId?: string;
  detailData: UbicacionDetailData | null;
  desktopFallback: UbicacionDetailData | null;
};

function UbicacionesWorkspaceInner({
  ubicaciones,
  facultades,
  selectedFacultad,
  selectedId,
  detailData,
  desktopFallback,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const activeDetail = detailData ?? (isDesktop ? desktopFallback : null);
  const showList = isDesktop || !selectedId;
  const showDetail = isDesktop ? !!activeDetail : !!detailData;

  function clearSelection() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    const qs = params.toString();
    router.push(qs ? `/ubicaciones?${qs}` : "/ubicaciones");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <Card className={cn("overflow-hidden", !showList && "hidden lg:block")}>
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-medium text-gray-700">
            {ubicaciones.length} ubicacion{ubicaciones.length === 1 ? "" : "es"}
          </p>
        </div>
        <div className="max-h-[70vh] overflow-hidden">
          <UbicacionesSidebar
            ubicaciones={ubicaciones}
            facultades={facultades}
            selectedId={selectedId ?? desktopFallback?.id}
            selectedFacultad={selectedFacultad}
          />
        </div>
      </Card>

      <Card className={cn(!showDetail && "hidden lg:block")}>
        <CardContent className="py-6">
          {!showDetail || !activeDetail ? (
            <div className="flex min-h-[280px] items-center justify-center text-center text-gray-500 lg:min-h-[320px]">
              <p>Seleccioná una ubicación de la lista</p>
            </div>
          ) : (
            <>
              <MasterDetailBack label="Volver a ubicaciones" onBack={clearSelection} />
              <UbicacionDetail ubicacion={activeDetail} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function UbicacionesWorkspace(props: Props) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-gray-100" />}>
      <UbicacionesWorkspaceInner {...props} />
    </Suspense>
  );
}
