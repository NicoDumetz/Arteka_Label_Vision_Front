// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : index.tsx
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Friday May 15 2026
//
// =============================================================

import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const id = useId();

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-manrope-medium text-subtitle-color">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`w-full rounded-md bg-dark border border-dark-contrast px-3 py-2.5 text-white placeholder:text-contrast-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors ${
            error ? "border-error focus:border-error focus:ring-error" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-error mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";