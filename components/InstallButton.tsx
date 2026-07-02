"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => void; userChoice: Promise<unknown> };

/** Botón "Instalar app" — solo aparece cuando el navegador lo permite (Android/desktop). */
export function InstallButton({
  className = "",
  label = "Instalar como app",
}: {
  className?: string;
  label?: string;
}) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (instalado || !deferred) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      className={className}
    >
      {label}
    </button>
  );
}
