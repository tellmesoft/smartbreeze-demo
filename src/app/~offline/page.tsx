import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
      <BrandLogo link={false} variant="full" className="mx-auto mb-6 h-12 w-auto" />
      <h1 className="text-xl font-bold text-gray-900">Sin conexión</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        No hay internet disponible. Revisá tu conexión e intentá de nuevo para acceder a Smartbreeze.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-blue-700"
      >
        Reintentar
      </Link>
    </div>
  );
}
