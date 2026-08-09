"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/estimator-sw.js", {
        scope: "/estimator/app/",
      });
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  const install = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) setShowIosHelp(true);
  };

  if (!installPrompt && !showIosHelp) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[70] max-w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-white/20 bg-[#071E33] p-4 text-white shadow-[0_22px_55px_rgba(7,30,51,0.35)] lg:bottom-6">
      {showIosHelp ? (
        <div>
          <p className="text-sm font-bold">Install on iPhone or iPad</p>
          <p className="mt-2 text-xs leading-5 text-white/70">
            Open this page in Safari, tap Share, then choose Add to Home Screen.
          </p>
          <button type="button" onClick={() => setShowIosHelp(false)} className="mt-3 text-xs font-bold text-[#E7B34B]">
            Got it
          </button>
        </div>
      ) : (
        <button type="button" onClick={install} className="flex items-center gap-3 text-left">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#E7B34B] font-bold text-[#071E33]">+</span>
          <span><strong className="block text-sm">Install Estimator</strong><span className="text-xs text-white/65">Add it to this device</span></span>
        </button>
      )}
    </div>
  );
}
