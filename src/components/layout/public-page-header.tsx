import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type PublicPageHeaderProps = {
  backHref: string;
  backLabel: string;
  className?: string;
};

export function PublicPageHeader({ backHref, backLabel, className }: PublicPageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {backLabel}
        </Link>
      </div>
    </header>
  );
}
