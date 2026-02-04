'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import '@/styles/shiny-button.css';

interface AIButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  className?: string;
}

export function AIButton({
  onClick,
  disabled = false,
  isLoading = false,
  loadingText = 'Generating...',
  children = 'AI Generate',
  variant = 'default',
  size = 'sm',
  type = 'button',
  className = '',
}: AIButtonProps) {
  const sizeStyles = {
    sm: '!text-xs !py-2 !px-3',
    md: '!text-sm !py-2.5 !px-4',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`shiny-cta ${sizeStyles[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {children}
          </>
        )}
      </span>
    </button>
  );
}
