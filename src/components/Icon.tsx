"use client";
import React, { useMemo } from "react";
import dynamic from 'next/dynamic';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { LucideProps } from "lucide-react";

interface IconProps extends LucideProps {
  name: keyof typeof dynamicIconImports;
}

class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing key
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }
}

const iconCache = new LRUCache<keyof typeof dynamicIconImports, React.ComponentType<LucideProps>>(50);

const Icon = ({ name, ...props }: IconProps) => {
  const DynamicIcon = useMemo(() => {
    const cachedIcon = iconCache.get(name);
    if (cachedIcon) {
      return cachedIcon;
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