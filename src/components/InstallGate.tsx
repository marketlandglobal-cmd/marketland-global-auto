import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Smartphone, Share, PlusSquare, MonitorDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  isBlockedContext,
  getInstallPrompt,
  clearInstallPrompt,
  onInstallPromptChange,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa";

const INSTALLED_KEY = "mlg-installed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches ||
    window.matchMedia?.("(display-mode: minimal-ui)").matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function platform() {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  return { isIOS, isAndroid };
}

export function InstallGate({ children }: { children: ReactNode }) {
  // Undefined until hydration decides, so SSR markup stays stable.
  const [allowed, setAllowed] = useState<boolean | undefined>(undefined);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dismissedPrompt, setDismissedPrompt] = useState(false);

  useEffect(() => {
    // Editor preview, iframes, dev and OAuth callbacks must never be gated.
    if (isBlockedContext() || window.location.pathname.startsWith("/~oauth")) {
      setAllowed(true);
      return;
    }

    if (isStandalone() || localStorage.getItem(INSTALLED_KEY) === "1") {
      setAllowed(true);
      return;
    }

    setAllowed(false);

    // The event may already have fired before hydration — read the captured one.
    setPromptEvent(getInstallPrompt());
    const unsubscribe = onInstallPromptChange(setPromptEvent);

    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setAllowed(true);
    };
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => {
      if (isStandalone()) onInstalled();
    };

    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", onDisplayModeChange);

    return () => {
      unsubscribe();
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const event = promptEvent ?? getInstallPrompt();
    if (!event) {
      // No official prompt available (iOS Safari, or the browser hasn't offered
      // it yet) — show the shortest supported flow for this device.
      setShowInstructions(true);
      return;
    }
    await event.prompt();
    const { outcome } = await event.userChoice;
    clearInstallPrompt();
    setPromptEvent(null);
    if (outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "1");
      setAllowed(true);
    } else {
      setDismissedPrompt(true);
    }
  }, [promptEvent]);

  if (allowed === undefined) {
    return (
      <div className="grid min-h-screen place-items-center deep-panel">
        <span className="sr-only">Loading Marketland Global</span>
      </div>
    );
  }

  if (allowed) return <>{children}</>;

  const { isIOS, isAndroid } = platform();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center deep-panel px-5 py-10 text-center">
      <img
        src="/icon-192.png"
        alt="Marketland Global app icon"
        width={96}
        height={96}
        className="size-24 rounded-2xl border border-white/15 shadow-lg"
      />
      <h1 className="mt-7 text-3xl font-bold leading-tight sm:text-4xl">
        Welcome to Marketland Global
      </h1>
      <p className="mt-3 text-base opacity-85">Install the app to continue</p>

      <Button
        variant="hero"
        size="lg"
        onClick={handleInstall}
        className="mt-9 h-14 w-full max-w-sm text-base font-bold"
      >
        <Smartphone className="mr-2 size-5" /> 📲 INSTALL APP
      </Button>

      {dismissedPrompt && (
        <p className="mt-4 max-w-sm text-sm opacity-80">
          Installation was cancelled. Tap INSTALL APP again to continue.
        </p>
      )}

      {(showInstructions || isIOS) && (
        <div className="mt-8 w-full max-w-sm rounded-xl border border-white/15 bg-white/5 p-5 text-left text-sm">
          <p className="font-bold">Two quick taps to finish</p>
          {isIOS ? (
            <ol className="mt-3 space-y-2 opacity-90">
              <li className="flex gap-2">
                <Share className="mt-0.5 size-4 shrink-0" />
                <span>1. Tap the Share icon at the bottom of Safari.</span>
              </li>
              <li className="flex gap-2">
                <PlusSquare className="mt-0.5 size-4 shrink-0" />
                <span>2. Tap “Add to Home Screen”, then “Add”.</span>
              </li>
              <li className="opacity-80">
                iOS does not allow apps to install themselves, so this confirmation is required.
              </li>
            </ol>
          ) : isAndroid ? (
            <ol className="mt-3 space-y-2 opacity-90">
              <li className="flex gap-2">
                <Smartphone className="mt-0.5 size-4 shrink-0" />
                <span>1. Tap INSTALL APP again — your browser will show its install dialog.</span>
              </li>
              <li>2. Tap “Install” to confirm. Android always asks for this confirmation.</li>
            </ol>
          ) : (
            <ol className="mt-3 space-y-2 opacity-90">
              <li className="flex gap-2">
                <MonitorDown className="mt-0.5 size-4 shrink-0" />
                <span>1. Tap INSTALL APP again to open your browser&apos;s install dialog.</span>
              </li>
              <li>2. Confirm the installation to continue.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
