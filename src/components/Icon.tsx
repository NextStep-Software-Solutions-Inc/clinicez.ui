"use client";
import React, { useMemo } from "react";
import dynamic from 'next/dynamic';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { LucideProps } from "lucide-react";

interface IconProps extends LucideProps {
  name: keyof typeof dynamicIconImports;
}

const iconCache = new Map<keyof typeof dynamicIconImports, React.ComponentType<LucideProps>>();

const Icon = ({ name, ...props }: IconProps) => {
  const DynamicIcon = useMemo(() => {
    if (iconCache.has(name)) {
      return iconCache.get(name)!;
    }

    const IconComponent = dynamic(
      dynamicIconImports[name],
      { 
        ssr: false,
        loading: () => <div className="h-5 w-5 bg-gray-200 animate-pulse rounded" />,
      }
    );

    iconCache.set(name, IconComponent);
    return IconComponent;
  }, [name]);

  return <DynamicIcon {...props} />;
};

export default Icon;