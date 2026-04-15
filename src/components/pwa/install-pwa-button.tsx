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
 * A floating "Install App" button that leverages the browser's
 * `beforeinstallprompt` event to trigger the native PWA install dialog.
 *
 * - Appears only when the browser fires `beforeinstallprompt`
 *   (i.e., the app is installable and not yet installed).
 * - Dismisses itself after the user accepts or dismisses the prompt.
 * - Fixed to the bottom-right corner, styled with the Shadcn/ui design system.
 */
export default function InstallPWAButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch (err) {
      console.warn("PWA install prompt failed:", err);
    } finally {
      // Hide the button regardless of whether the user accepted or dismissed —
      // re-prompting immediately after a dismissal is poor UX.
      setIsVisible(false);
      setInstallPrompt(null);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleInstallClick}
        className="flex items-center gap-2 shadow-lg rounded-full px-5 py-3 h-auto text-sm font-semibold"
        aria-label="Install Clinic EZ app"
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>
    </div>
  );
}
