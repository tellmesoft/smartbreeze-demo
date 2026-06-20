"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";

export function usePendingRouter() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      startTransition(() => {
        router.push(href, options);
      });
    },
    [router]
  );

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return { isPending, push, refresh, router };
}
