"use client";

import { Download, Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
}

type PwaInstallButtonProps = {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  fullWidth?: boolean;
};

export function PwaInstallButton({
  className,
  variant = "outline",
  size = "sm",
  fullWidth = false,
}: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIosDevice(isIosSafari());

    if (isStandaloneDisplay()) {
      setInstalled(true);
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (!mounted || installed) return null;

  async function handleInstall() {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setInstalled(true);
        }
      } finally {
        setDeferredPrompt(null);
        setInstalling(false);
      }
      return;
    }

    if (iosDevice) {
      setIosHint((open) => !open);
    }
  }

  const showIosOnly = !deferredPrompt && iosDevice;

  if (!deferredPrompt && !showIosOnly) return null;

  return (
    <div className={cn(fullWidth && "w-full", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(fullWidth && "w-full justify-center gap-2")}
        loading={installing}
        loadingText="Instalando..."
        onClick={handleInstall}
      >
        <Download className="h-4 w-4 shrink-0" />
        Instalar app
      </Button>

      {iosHint ? (
        <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/80 p-3 text-left text-xs text-blue-900">
          <p className="mb-2 flex items-center gap-1.5 font-medium">
            <Smartphone className="h-3.5 w-3.5" />
            Instalar en iPhone / iPad
          </p>
          <ol className="list-decimal space-y-1 pl-4 text-blue-800">
            <li className="flex items-start gap-1">
              <Share className="mt-0.5 h-3 w-3 shrink-0" />
              <span>Tocá Compartir en Safari</span>
            </li>
            <li>Elegí &quot;Agregar a pantalla de inicio&quot;</li>
            <li>Confirmá con &quot;Agregar&quot;</li>
          </ol>
        </div>
      ) : null}
    </div>
  );
}
