import type { HTMLAttributes, ReactNode } from "react";
import { useMemo } from "react";

import { cn } from "../../helpers/Cn";

type TagTone = "primary" | "secondary" | "tertiary" | "neutral";
type TagIconPosition = "left" | "right";

const toneClasses: Record<TagTone, string> = {
  primary: "border-primary-200 bg-primary-100 text-primary",
  secondary: "border-secondary-200 bg-secondary-100 text-secondary-600",
  tertiary: "border-tertiary-200 bg-tertiary-100 text-tertiary-600",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
};

export interface TagProps extends HTMLAttributes<HTMLDivElement> {
  text: string;
  icon?: ReactNode;
  iconPosition?: TagIconPosition;
  tone?: TagTone;
}

export function Tag({
  className,
  icon,
  iconPosition = "left",
  text,
  tone = "primary",
  ...props
}: TagProps) {
  return useMemo(
    () => (
      <div
        {...props}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
          toneClasses[tone],
          className,
        )}
      >
        {icon && iconPosition === "left" ? <span className="inline-flex text-base">{icon}</span> : null}
        <span>{text}</span>
        {icon && iconPosition === "right" ? <span className="inline-flex text-base">{icon}</span> : null}
      </div>
    ),
    [className, icon, iconPosition, props, text, tone],
  );
}
