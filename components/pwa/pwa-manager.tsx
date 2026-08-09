"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setIsInstalled(standalone);

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setPlatform("ios");
    } else if (/android/i.test(navigator.userAgent)) {
      setPlatform("android");
    }

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/estimator-sw.js", { scope: "/estimator/app/" })
        .catch((error: unknown) => {
          console.error("Estimator service worker registration failed", error);
        });
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setIsInstalled(true);
      setInstallPrompt(null);
      return;
    }

    setShowHelp(true);
  };

  if (isInstalled) return null;

  const instructions =
    platform === "ios"
      ? "In Safari, tap Share, then choose Add to Home Screen."
      : platform === "android"
        ? "In Chrome, tap the three-dot menu, then choose Install app or Add to Home screen."
        : "In Chrome or Edge, open the browser menu and choose Install Charismak Estimator.";

  return (
    <div
      data-pwa-install
      className="fixed bottom-24 right-4 z-[90] max-w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-white/20 bg-[#071E33] p-4 text-white shadow-[0_22px_55px_rgba(7,30,51,0.35)] lg:bottom-6"
    >
      {showHelp ? (
        <div>
          <div className="flex items-start justify-between gap-5">
            <p className="text-sm font-bold">Install Charismak Estimator</p>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              aria-label="Close installation help"
              className="text-lg leading-none text-white/55 hover:text-white"
            >
              ×
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-white/70">
            {instructions}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-white/45">
            Your browser must ask for final confirmation; websites cannot install silently.
          </p>
        </div>
      ) : (
        <button type="button" onClick={install} className="flex w-full items-center gap-3 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#E7B34B] text-xl font-bold text-[#071E33]">↓</span>
          <span>
            <strong className="block text-sm">Install App</strong>
            <span className="text-xs text-white/65">
              {installPrompt ? "Ready to add to this device" : "Tap for installation steps"}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
