"use client";

import { AlertTriangle, Home, RefreshCw, Mail, ArrowRight } from "lucide-react";
import { Button } from "@components/ui/button";
import "@styles/patient-dashboard.css";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ClinicDashboardError({ error, reset }: ErrorProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen w-full bg-slate-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full mix-blend-multiply blur-3xl animate-float"
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full mix-blend-multiply blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8 sm:px-6 md:px-8">
        <div className="w-full max-w-2xl">
          {/* Icon with animation */}
          <div className="flex justify-center mb-8 items-center">
            <div className="relative animate-bounce">
              <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-4 rounded-full">
                <AlertTriangle className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-lg text-slate-300 mb-2">
              We encountered an unexpected error loading the clinic dashboard.
            </p>
            <p className="text-sm text-slate-400">
              Error ID: <span className="font-mono text-red-400">{error.digest || "unknown"}</span>
            </p>
          </div>

          {/* Error details (development only) */}
          {isDevelopment && (
            <div className="mb-8 p-4 rounded-lg bg-red-950/50 border border-red-500/30 backdrop-blur-sm">
              <p className="text-xs font-mono text-red-300 whitespace-pre-wrap break-words">
                {error.message || "Unknown error"}
              </p>
            </div>
          )}

          {/* Helpful suggestions */}
          <div className="mb-12 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              What you can try:
            </h2>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-red-500/30 transition-colors\">
                <div className="flex-shrink-0 mt-1">
                  <RefreshCw className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Refresh the page</p>
                  <p className="text-xs text-slate-400">
                    Temporary issues are often resolved by refreshing
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-red-500/30 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <Home className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Return to dashboard</p>
                  <p className="text-xs text-slate-400">
                    Start fresh from your main clinic dashboard
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-red-500/30 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  <Mail className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Contact support</p>
                  <p className="text-xs text-slate-400">
                    If the issue persists, our team is here to help
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={reset}
              size="lg"
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-600 hover:border-red-500/50 hover:bg-slate-800/50"
            >
              <a href="/v2">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </a>
            </Button>
          </div>

          {/* Support link */}
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-400">
              Need immediate assistance?{" "}
              <a href="mailto:support@clinicez.com" className="text-red-400 hover:text-red-300 transition-colors font-medium">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Animations */}
    </div>
  );
}
