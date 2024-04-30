import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import React, { Suspense } from "react";
import GlobalError from "./GlobalError";

interface Props {
    errorFallback?: ({ error, reset }: {error: Error & { digest?: string }, reset: () => void}) => JSX.Element;
    loadingFallback?: JSX.Element;
    children: React.ReactNode;
}

export default function Suspend({ children, errorFallback =  GlobalError, loadingFallback = <div>Loading resources</div> }: Props) {
  return (
    <ErrorBoundary errorComponent={errorFallback}>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>    
    </ErrorBoundary>
  );
}
