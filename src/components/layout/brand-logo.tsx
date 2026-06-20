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
  wordmarkClassName?: string;
  /** centered = logo a la izquierda, nombre centrado (login) */
  wordmarkLayout?: "inline" | "centered";
};

export function BrandLogo({
  className,
  href = "/dashboard",
  link = true,
  priority = false,
  variant = "mark",
  showWordmark = false,
  wordmarkClassName,
  wordmarkLayout = "inline",
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
          : cn(
              "shrink-0 object-contain object-left",
              wordmarkLayout === "centered" ? "h-10 w-10" : "h-14 w-14"
            ),
        !showWordmark && className
      )}
    />
  );

  const wordmark = showWordmark ? (
    <div
      className={cn(
        "min-w-0 leading-tight",
        wordmarkLayout === "centered" && "text-center"
      )}
    >
      <p className={cn("text-sm font-semibold text-gray-900", wordmarkClassName)}>
        Smartbreeze
      </p>
      <p className={cn("text-sm font-medium text-gray-500", wordmarkClassName)}>Innovations</p>
    </div>
  ) : null;

  const content = showWordmark ? (
    wordmarkLayout === "centered" ? (
      <div
        className={cn(
          "grid w-full grid-cols-[1fr_auto_1fr] items-center gap-x-3",
          className
        )}
      >
        <div className="flex justify-end">{image}</div>
        {wordmark}
        <div aria-hidden="true" />
      </div>
    ) : (
      <div className={cn("flex items-center gap-2.5", className)}>
        {image}
        {wordmark}
      </div>
    )
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
