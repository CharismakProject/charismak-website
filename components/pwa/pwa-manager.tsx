"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setIsInstalled(standalone);

    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroidDevice = /android/i.test(navigator.userAgent);

    if (isIosDevice) {
      setPlatform("ios");
    } else if (isAndroidDevice) {
      setPlatform("android");
    }

    const welcomeTimer = window.setTimeout(() => {
      if (!standalone && (isIosDevice || isAndroidDevice)) setDialogOpen(true);
    }, 900);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/estimator-sw.js", { scope: "/estimator/app" })
        .catch((error: unknown) => {
          console.error("Estimator service worker registration failed", error);
        });
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setDialogOpen(true);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setDialogOpen(false);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.clearTimeout(welcomeTimer);
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

    setDialogOpen(true);
  };

  if (isInstalled) return null;

  const instructions =
    platform === "ios"
      ? "In Safari, tap Share, then choose Add to Home Screen."
      : platform === "android"
        ? "In Chrome, tap the three-dot menu, then choose Install app or Add to Home screen."
        : "In Chrome, open the top-right three-dot menu, then choose Cast, save and share → Install page as app. In Edge, use Apps → Install this site as an app.";

  return (
    <div data-pwa-install>
      {dialogOpen ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#041526]/75 p-5 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-estimator-title"
            className="w-full max-w-md overflow-hidden rounded-[30px] border border-white/15 bg-white text-[#071E33] shadow-[0_30px_100px_rgba(0,0,0,0.4)]"
          >
            <div className="bg-[#0D3B66] px-6 py-7 text-white">
              <div className="flex items-start justify-between gap-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E7B34B] text-2xl font-black text-[#071E33]">↓</span>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  aria-label="Close installation dialog"
                  className="text-2xl leading-none text-white/55 hover:text-white"
                >
                  ×
                </button>
              </div>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#E7B34B]">Mobile estimator</p>
              <h2 id="install-estimator-title" className="mt-2 text-2xl font-black">Install Charismak Estimator</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Keep the estimator on your home screen and open it like a normal app.
              </p>
            </div>
            <div className="p-6">
              {installPrompt ? (
                <>
                  <p className="text-sm leading-6 text-[#526579]">
                    The app is ready. Tap below, then confirm the secure installation request from your phone.
                  </p>
                  <button
                    type="button"
                    onClick={install}
                    className="mt-5 w-full rounded-2xl bg-[#C8320A] px-5 py-4 text-sm font-black text-white shadow-[0_14px_32px_rgba(200,50,10,0.22)]"
                  >
                    Install App
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold">Installation step</p>
                  <p className="mt-2 text-sm leading-6 text-[#526579]">{instructions}</p>
                  <p className="mt-4 rounded-2xl bg-[#EEF3F8] p-4 text-xs leading-5 text-[#526579]">
                    If this app was previously installed from another link, remove that older copy first and reopen this page.
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="mt-4 w-full px-5 py-2 text-xs font-bold text-[#526579]"
              >
                Not now
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="fixed bottom-24 right-4 z-[90] max-w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-white/20 bg-[#071E33] p-4 text-white shadow-[0_22px_55px_rgba(7,30,51,0.35)] lg:bottom-6">
          <button type="button" onClick={() => setDialogOpen(true)} className="flex w-full items-center gap-3 text-left">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#E7B34B] text-xl font-bold text-[#071E33]">↓</span>
            <span>
              <strong className="block text-sm">Install App</strong>
              <span className="text-xs text-white/65">
                {installPrompt ? "Ready to add to this device" : "Tap for installation steps"}
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
