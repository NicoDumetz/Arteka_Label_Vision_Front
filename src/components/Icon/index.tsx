import type { HTMLAttributes, ReactNode } from "react";
import { useMemo } from "react";

import { cn } from "../../helpers/Cn";

type IconSize = "sm" | "base" | "lg" | "xl" | "2xl";
type IconColor = "primary" | "secondary" | "tertiary" | "quaternary" | "error" | "dark" | "white";

const sizeClasses: Record<IconSize, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

const colorClasses: Record<IconColor, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  tertiary: "text-tertiary",
  quaternary: "text-quaternary",
  error: "text-error",
  dark: "text-dark",
  white: "text-white",
};

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  icon: ReactNode;
  size?: IconSize;
  color?: IconColor;
}

export function Icon({ className, color, icon, size = "base", ...props }: IconProps) {
  return useMemo(
    () => (
    <span
      {...props}
      className={cn(
        "inline-flex items-center justify-center leading-none",
        sizeClasses[size],
        color ? colorClasses[color] : undefined,
        className,
      )}
    >
      {icon}
    </span>
    ),
    [className, color, icon, props, size],
  );
}
