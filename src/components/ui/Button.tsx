"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex select-none items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.985]";
    const variants = {
      primary:
        "bg-accent text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.9)] hover:bg-accent-hover",
      secondary:
        "bg-elevated text-fg border border-line hover:border-line-strong hover:bg-surface-hover",
      outline:
        "bg-transparent text-fg border border-line-strong hover:bg-elevated",
      ghost: "text-muted hover:text-fg hover:bg-elevated",
      danger: "bg-rose-600 text-white hover:bg-rose-700",
      success: "bg-emerald-600 text-white hover:bg-emerald-700",
    };
    const sizes = {
      xs: "px-2.5 py-1 text-xs gap-1 rounded-md",
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
      icon: "h-9 w-9",
    };
    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
