"use client";

import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import React, { Suspense } from "react";
import GlobalError from "./GlobalError";

interface Props {
  errorFallback?: ({ error, reset }: { error: any, reset?: () => void }) => React.JSX.Element;
  loadingFallback?: React.JSX.Element;
  children: React.ReactNode;
}

const defaultErrorFallback = ({ error, reset }: { error: any, reset?: () => void }) => {
  return <GlobalError error={error instanceof Error ? error : new Error(String(error))} reset={reset ?? (() => { })} />;
};

export default function Suspend({ children, errorFallback = defaultErrorFallback, loadingFallback = <div>Loading resources...</div> }: Props) {
  return (
    <ErrorBoundary errorComponent={errorFallback}>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
