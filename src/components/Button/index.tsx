import CircularProgressIcon from "@mui/icons-material/CachedOutlined";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "../../helpers/Cn";
import { noop } from "../../helpers/Fn";
import { isPromise } from "../../helpers/Promise";

type ButtonSize = "xs" | "sm" | "base" | "lg" | "xl";
type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonColor = "primary" | "secondary" | "tertiary" | "quaternary" | "error";
type IconPosition = "left" | "right" | "top" | "bottom";

const sizeClasses: Record<ButtonSize, string> = {
  xs: "text-xs px-2.5 py-1.5",
  sm: "text-sm px-3 py-2",
  base: "text-base px-4 py-2.5",
  lg: "text-lg px-5 py-3",
  xl: "text-xl px-6 py-3.5",
};

const solidClasses: Record<ButtonColor, string> = {
  primary: "border-primary bg-primary text-white hover:bg-primary-600",
  secondary: "border-secondary bg-secondary text-dark hover:bg-secondary-500",
  tertiary: "border-tertiary bg-tertiary text-white hover:bg-tertiary-500",
  quaternary: "border-quaternary bg-quaternary text-white hover:bg-quaternary-500",
  error: "border-error bg-error text-white hover:brightness-95",
};

const outlineClasses: Record<ButtonColor, string> = {
  primary: "border-primary text-primary hover:bg-primary-100",
  secondary: "border-secondary text-secondary hover:bg-secondary-100",
  tertiary: "border-tertiary text-tertiary hover:bg-tertiary-100",
  quaternary: "border-quaternary text-quaternary hover:bg-quaternary-100",
  error: "border-error text-error hover:bg-red-50",
};

const ghostClasses: Record<ButtonColor, string> = {
  primary: "border-transparent text-primary hover:bg-primary-100",
  secondary: "border-transparent text-secondary hover:bg-secondary-100",
  tertiary: "border-transparent text-tertiary hover:bg-tertiary-100",
  quaternary: "border-transparent text-quaternary hover:bg-quaternary-100",
  error: "border-transparent text-error hover:bg-red-50",
};

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "color"> {
  label?: string;
  icon?: ReactNode;
  iconPosition?: IconPosition;
  color?: ButtonColor;
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({
  className,
  color = "primary",
  disabled = false,
  icon,
  iconPosition = "left",
  label,
  loading = false,
  onClick,
  size = "base",
  type = "button",
  variant = "solid",
  ...props
}: ButtonProps) {
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  const handleClick: MouseEventHandler<HTMLButtonElement> = async (event) => {
    if (disabled || isLoading || !onClick) {
      noop();
      return;
    }

    const result = onClick(event);
    if (!isPromise(result)) {
      return;
    }

    setIsLoading(true);
    try {
      await result;
    } finally {
      setIsLoading(false);
    }
  };

  const toneClasses =
    variant === "outline"
      ? outlineClasses[color]
      : variant === "ghost"
        ? ghostClasses[color]
        : solidClasses[color];

  const isVertical = iconPosition === "top" || iconPosition === "bottom";
  const iconFirst = iconPosition === "left" || iconPosition === "top";

  const content = (
    <>
      {icon && iconFirst ? <span className={cn(isLoading && "invisible")}>{icon}</span> : null}
      {label ? <span className={cn(isLoading && "invisible")}>{label}</span> : null}
      {icon && !iconFirst ? <span className={cn(isLoading && "invisible")}>{icon}</span> : null}
    </>
  );

  return useMemo(
    () => (
    <button
      {...props}
      className={cn(
        "relative inline-flex select-none items-center justify-center gap-2 rounded-md border font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2",
        sizeClasses[size],
        toneClasses,
        isVertical ? "flex-col" : "flex-row",
        !label && icon ? "px-3" : undefined,
        (disabled || isLoading) && "cursor-not-allowed opacity-60",
        className,
      )}
      disabled={disabled || isLoading}
      onClick={handleClick}
      type={type}
    >
      {isLoading ? (
        <CircularProgressIcon className="absolute animate-spin" fontSize="small" />
      ) : null}
      {content}
    </button>
    ),
    [
      className,
      content,
      disabled,
      icon,
      isLoading,
      isVertical,
      label,
      props,
      size,
      toneClasses,
      type,
    ],
  );
}
