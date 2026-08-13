import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Smartphone, Share, MoreVertical, MonitorDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isBlockedContext } from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setAllowed(true);
    };
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => {
      if (isStandalone()) onInstalled();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!promptEvent) {
      setShowInstructions(true);
      return;
    }
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
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
          <p className="font-bold">How to install on this device</p>
          {isIOS ? (
            <ol className="mt-3 space-y-2 opacity-90">
              <li className="flex gap-2">
                <Share className="mt-0.5 size-4 shrink-0" />
                <span>Tap the Share button in Safari&apos;s toolbar.</span>
              </li>
              <li>2. Choose “Add to Home Screen”.</li>
              <li>3. Tap “Add”, then open Marketland Global from your home screen.</li>
            </ol>
          ) : isAndroid ? (
            <ol className="mt-3 space-y-2 opacity-90">
              <li className="flex gap-2">
                <MoreVertical className="mt-0.5 size-4 shrink-0" />
                <span>Open the browser menu (three dots) in Chrome.</span>
              </li>
              <li>2. Tap “Install app” or “Add to Home screen”.</li>
              <li>3. Confirm, then open Marketland Global from your home screen.</li>
            </ol>
          ) : (
            <ol className="mt-3 space-y-2 opacity-90">
              <li className="flex gap-2">
                <MonitorDown className="mt-0.5 size-4 shrink-0" />
                <span>Click the install icon in your browser&apos;s address bar.</span>
              </li>
              <li>2. Or open the browser menu and choose “Install Marketland Global”.</li>
              <li>3. Confirm the installation to continue.</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
