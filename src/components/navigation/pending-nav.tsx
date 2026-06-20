"use client";

import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { usePendingRouter } from "@/hooks/use-pending-router";
import { cn } from "@/lib/utils";

type PendingNavButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  loadingText?: string;
  scroll?: boolean;
} & Omit<ButtonProps, "onClick" | "loading" | "loadingText">;

export function PendingNavButton({
  href,
  children,
  className,
  loadingText = "Cargando...",
  scroll,
  ...props
}: PendingNavButtonProps) {
  const { isPending, push } = usePendingRouter();
  return (
    <Button
      {...props}
      className={className}
      loading={isPending}
      loadingText={loadingText}
      onClick={() => push(href, { scroll })}
    >
      {children}
    </Button>
  );
}

type PendingNavTextLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  loadingText?: string;
  scroll?: boolean;
};

export function PendingNavTextLink({
  href,
  children,
  className,
  loadingText = "Cargando...",
  scroll,
}: PendingNavTextLinkProps) {
  const { isPending, push } = usePendingRouter();
  return (
    <button
      type="button"
      onClick={() => push(href, { scroll })}
      disabled={isPending}
      aria-busy={isPending || undefined}
      className={cn(className)}
    >
      {isPending ? loadingText : children}
    </button>
  );
}

type PendingNavBlockProps = {
  href: string;
  children: ReactNode;
  className?: string;
  loadingText?: string;
  scroll?: boolean;
  onBeforeNavigate?: () => void;
  loadingMode?: "replace" | "inline";
};

export function PendingNavBlock({
  href,
  children,
  className,
  loadingText = "Cargando...",
  scroll,
  onBeforeNavigate,
  loadingMode = "replace",
}: PendingNavBlockProps) {
  const { isPending, push } = usePendingRouter();

  return (
    <button
      type="button"
      onClick={() => {
        onBeforeNavigate?.();
        push(href, { scroll });
      }}
      disabled={isPending}
      aria-busy={isPending || undefined}
      className={cn(className, isPending && loadingMode === "inline" && "opacity-80")}
    >
      {isPending && loadingMode === "replace" ? (
        <span className="flex w-full items-center justify-center gap-2">
          <Spinner size="sm" />
          <span className="text-sm text-gray-500">{loadingText}</span>
        </span>
      ) : (
        <>
          {children}
          {isPending && loadingMode === "inline" ? (
            <Spinner size="sm" className="ml-auto shrink-0" label={loadingText} />
          ) : null}
        </>
      )}
    </button>
  );
}
