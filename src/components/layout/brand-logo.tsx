import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  link?: boolean;
  priority?: boolean;
  /** mark = ícono recortado para sidebar */
  variant?: "mark" | "full";
  /** Texto junto al logo (sidebar) */
  showWordmark?: boolean;
};

export function BrandLogo({
  className,
  href = "/dashboard",
  link = true,
  priority = false,
  variant = "mark",
  showWordmark = false,
}: BrandLogoProps) {
  const src = variant === "full" ? "/logo.png" : "/logo-mark.png";

  const image = (
    <Image
      src={src}
      alt="Smartbreeze Innovations"
      width={variant === "full" ? 220 : 64}
      height={variant === "full" ? 64 : 64}
      priority={priority}
      className={cn(
        variant === "full"
          ? "h-16 w-auto max-w-[240px] object-contain object-left"
          : "h-14 w-14 shrink-0 object-contain object-left",
        !showWordmark && className
      )}
    />
  );

  const wordmark = showWordmark ? (
    <div className="min-w-0 leading-tight">
      <p className="text-sm font-semibold text-gray-900">Smartbreeze</p>
      <p className="text-sm font-medium text-gray-500">Innovations</p>
    </div>
  ) : null;

  const content = showWordmark ? (
    <div className={cn("flex items-center gap-2.5", className)}>
      {image}
      {wordmark}
    </div>
  ) : (
    image
  );

  if (!link) return content;

  return (
    <Link href={href} className="inline-flex cursor-pointer items-center">
      {content}
    </Link>
  );
}
