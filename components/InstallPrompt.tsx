"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "install-prompt-dismissed";

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (navigator.storage?.persist) {
      navigator.storage.persist();
    }

    if (isStandalone() || localStorage.getItem(STORAGE_KEY)) return;

    // iOS is handled by IOSInstallCTA in DhikrDeck — skip here to prevent double CTA
    if (isIOS()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(STORAGE_KEY, "1");
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 inset-x-4 z-50 rounded-2xl bg-card border border-border px-4 py-3 shadow-lg flex items-start gap-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-sans tracking-[0.15em] uppercase text-foreground">Add to Home Screen</p>
        <p className="text-[10px] font-sans text-muted-foreground mt-1 leading-relaxed">
          Install to protect your history from browser data eviction.
        </p>
        {deferredPrompt && (
          <button
            onClick={install}
            className="mt-2 text-[10px] font-sans tracking-widest uppercase text-accent hover:text-accent/80 transition-colors"
          >
            Install
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-muted-foreground/70 hover:text-muted-foreground transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
