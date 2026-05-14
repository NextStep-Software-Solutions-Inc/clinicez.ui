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
      size="icon"
      onClick={handleInstallClick}
      className="w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label={label}
    >
      <Download className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}
