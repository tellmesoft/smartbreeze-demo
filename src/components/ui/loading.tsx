import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const spinnerSizes = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-11 w-11 border-[3px]",
};

export function Spinner({ size = "md", className, label = "Cargando" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-[#2563EB] border-t-transparent",
        spinnerSizes[size],
        className
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("sb-skeleton rounded-md bg-gray-100", className)} aria-hidden />;
}

export function FiltersBarSkeleton() {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <Skeleton className="h-10 w-full xl:max-w-md" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>
    </div>
  );
}

function ListPanelSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-12 w-14 shrink-0 rounded" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-10 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailPanelSkeleton() {
  return (
    <div className="hidden rounded-lg border border-gray-200 bg-white p-6 lg:block">
      <Skeleton className="mb-4 h-6 w-48" />
      <Skeleton className="mb-2 h-4 w-full max-w-lg" />
      <Skeleton className="mb-6 h-4 w-2/3 max-w-md" />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

export function MasterDetailPageSkeleton({ filters = true }: { filters?: boolean }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      {filters ? <FiltersBarSkeleton /> : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <ListPanelSkeleton />
        <DetailPanelSkeleton />
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
    </div>
  );
}

export function ReportesPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-28 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function LoginPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <Skeleton className="h-7 w-40" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

type LoadingOverlayProps = {
  label?: string;
  className?: string;
  subtle?: boolean;
};

export function LoadingOverlay({
  label = "Procesando...",
  className,
  subtle = false,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg",
        subtle ? "bg-white/60 backdrop-blur-[1px]" : "bg-white/80 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size="md" />
      <p className="mt-3 text-sm font-medium text-gray-600">{label}</p>
    </div>
  );
}

export function AsyncContent({
  pending,
  label,
  children,
  className,
}: {
  pending: boolean;
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {pending ? <LoadingOverlay label={label} subtle /> : null}
      {children}
    </div>
  );
}

export function InlineSearchLoading({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="absolute right-3 top-1/2 -translate-y-1/2">
      <Spinner size="sm" className="text-[#2563EB]" label="Buscando" />
    </span>
  );
}
