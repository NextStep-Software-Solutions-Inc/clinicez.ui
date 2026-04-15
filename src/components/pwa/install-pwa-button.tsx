"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@components/ui/button";
import { Download, X } from "lucide-react";

/**
 * BeforeInstallPromptEvent is a non-standard browser event that extends Event.
 * It is fired when the browser determines the app is installable.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

interface Position {
  x: number;
  y: number;
}

/**
 * InstallPWAButton
 *
 * A floating "Install App" button that leverages the browser's
 * `beforeinstallprompt` event to trigger the native PWA install dialog.
 *
 * - Appears only when the browser fires `beforeinstallprompt`.
 * - Draggable via mouse or touch — user can reposition it anywhere on screen.
 * - Has a close (×) button to dismiss it for the session.
 * - Dismisses itself after the user accepts or dismisses the install prompt.
 */
export default function InstallPWAButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Ref to the floating container so we can measure its size for clamping
  const containerRef = useRef<HTMLDivElement>(null);
  // Offset from the pointer to the top-left corner of the element when drag starts
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  // Track whether a meaningful drag happened (to distinguish click vs drag)
  const hasDragged = useRef(false);

  // Initialise position to bottom-right on first mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { offsetWidth: w, offsetHeight: h } = el;
    setPosition({
      x: window.innerWidth - w - 24,
      y: window.innerHeight - h - 24,
    });
  }, [isVisible]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  // Clamp position so the element stays fully within the viewport
  const clamp = useCallback((x: number, y: number): Position => {
    const el = containerRef.current;
    if (!el) return { x, y };
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    return {
      x: Math.min(Math.max(0, x), window.innerWidth - w),
      y: Math.min(Math.max(0, y), window.innerHeight - h),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag with primary button / single touch
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    hasDragged.current = false;
    setIsDragging(true);
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    hasDragged.current = true;
    const next = clamp(
      e.clientX - dragOffset.current.x,
      e.clientY - dragOffset.current.y,
    );
    setPosition(next);
  }, [isDragging, clamp]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInstallClick = async () => {
    // Ignore click if the user was just dragging
    if (hasDragged.current) return;
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch (err) {
      console.warn("PWA install prompt failed:", err);
    } finally {
      setIsVisible(false);
      setInstallPrompt(null);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setInstallPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Install app prompt"
      className="fixed z-50 flex items-center gap-1 select-none"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Button
        onClick={handleInstallClick}
        className="flex items-center gap-2 shadow-lg rounded-full px-5 py-3 h-auto text-sm font-semibold"
        aria-label="Install Clinic EZ app"
        style={{ cursor: isDragging ? "grabbing" : "pointer" }}
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>
      <button
        onClick={handleClose}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground shadow transition-colors"
        aria-label="Dismiss install prompt"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
