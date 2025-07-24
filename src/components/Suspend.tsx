"use client";

import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import React, { Suspense } from "react";
import GlobalError from "./GlobalError";

interface Props {
  errorFallback?: ({ error, reset }: { error: Error, reset?: () => void }) => JSX.Element;
  loadingFallback?: JSX.Element;
  children: React.ReactNode;
}

const defaultErrorFallback = ({ error, reset }: { error: Error, reset?: () => void }) => {
  return <GlobalError error={error} reset={reset ?? (() => { })} />;
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
