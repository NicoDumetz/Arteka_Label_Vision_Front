import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../helpers/Cn";

type SegmentSize = "sm" | "base" | "lg";
type IconPosition = "right" | "left";

const sizeClasses: Record<SegmentSize, string> = {
  sm: "text-sm px-3 py-2",
  base: "text-base px-4 py-2.5",
  lg: "text-lg px-5 py-3",
};

export interface SegmentOption {
  label: string;
  value: string;
  icon?: ReactNode;
}

export interface SegmentProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentOption[];
  size?: SegmentSize;
  iconPosition?: IconPosition;
  className?: string;
}

export function Segment({
  className,
  iconPosition = "left",
  onChange,
  options,
  size = "base",
  value,
}: SegmentProps) {
  const [position, setPosition] = useState({ left: 0, width: 0 });
  const items = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((item) => item.value === value);

  useEffect(() => {
    const activeItem = items.current[selectedIndex];
    if (!activeItem) {
      return;
    }

    setPosition({
      left: activeItem.offsetLeft,
      width: activeItem.offsetWidth,
    });
  }, [options, selectedIndex]);

  return useMemo(
    () => (
    <div
      className={cn(
        "relative inline-flex w-fit rounded-xl border border-contrast-200 bg-contrast-100 p-1.5",
        className,
      )}
    >
      <span
        className="absolute bottom-1.5 top-1.5 rounded-lg bg-primary transition-all duration-300 ease-out"
        style={{ left: position.left, width: position.width }}
      />
      {options.map((option, index) => {
        const active = index === selectedIndex;

        return (
          <button
            key={option.value}
            ref={(element) => {
              items.current[index] = element;
            }}
            className={cn(
              "relative z-10 inline-flex items-center justify-center gap-2 rounded-lg font-medium transition",
              sizeClasses[size],
              active ? "text-white" : "text-dark hover:text-primary",
            )}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {iconPosition === "left" ? option.icon : null}
            <span>{option.label}</span>
            {iconPosition === "right" ? option.icon : null}
          </button>
        );
      })}
    </div>
    ),
    [className, iconPosition, onChange, options, position.left, position.width, selectedIndex, size],
  );
}
