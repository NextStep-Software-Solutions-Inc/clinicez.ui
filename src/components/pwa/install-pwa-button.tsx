"use client";

import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Download } from "lucide-react";

/**
 * BeforeInstallPromptEvent is a non-standard browser event that extends Event.
 * It is fired when the browser determines the app is installable.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * InstallPWAButton
 *
 * A compact header button that leverages the browser's `beforeinstallprompt`
 * event to trigger the native PWA install dialog.
 *
 * - Appears only when the browser fires `beforeinstallprompt` (i.e. the app
 *   is installable and not yet installed).
 * - Dismisses itself after the user accepts or dismisses the install prompt.
 * - Renders nothing on platforms that do not support PWA installation.
 */
export default function InstallPWAButton({ label = "Install App" }: { label?: string }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch (err) {
      console.warn("PWA install prompt failed:", err);
    } finally {
      setInstallPrompt(null);
    }
  };

  if (!installPrompt) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstallClick}
      className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg"
      aria-label={label}
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">Install App</span>
    </Button>
  );
}
