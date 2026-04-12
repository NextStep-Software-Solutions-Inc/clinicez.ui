"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import HPListByTypeFallback from "@/components/v2/hp/HPListByTypeFallback";

const header = {
  title: "Meet our Healthcare Providers",
  description:
    "Our Healthcare Providers are equipped with the latest technology to provide you with the best care possible.",
};

function LoadingContent() {
  const searchParams = useSearchParams();

  const { hpTypeName, search } = useMemo(() => {
    const typeParam = searchParams.get("type")?.trim() ?? "";
    const normalizedSearch = searchParams.get("search")?.trim() ?? "";

    return {
      hpTypeName: typeParam.length ? typeParam : null,
      search: normalizedSearch,
    };
  }, [searchParams]);

  return (
    <>
      {hpTypeName ? (
        <HPListByTypeFallback hpTypeName={hpTypeName} initialSearch={search} />
      ) : (
        <div className="flex justify-center py-16">
          <p className="text-sm text-muted-foreground sm:text-base">
            Loading healthcare provider types...
          </p>
        </div>
      )}
    </>
  );
}

export default function Loading() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div
        className="fixed left-0 top-0 z-[-1] h-screen w-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/hero-v2-1.png')",
          opacity: 0.2,
        }}
      />

      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold text-primary-v2 sm:text-4xl md:text-5xl">
          {header.title}
        </h1>
        <p className="mx-auto max-w-3xl text-sm text-label-v2 sm:text-base md:text-lg">
          {header.description}
        </p>
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-16">
          <p className="text-sm text-muted-foreground sm:text-base">
            Loading healthcare provider types...
          </p>
        </div>
      }>
        <LoadingContent />
      </Suspense>
    </div>
  );
}
