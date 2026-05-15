import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import type {
  ChangeEvent,
  Dispatch,
  HTMLProps,
  HTMLInputTypeAttribute,
  KeyboardEvent,
  ReactElement,
  SetStateAction,
} from "react";
import { useMemo, useRef, useState } from "react";

import { Icon } from "../Icon";
import { cn } from "../../helpers/Cn";
import { noop } from "../../helpers/Fn";

enum InputState {
  Error = "error",
  Correct = "correct",
  Default = "black",
}

type InputValue = string | number | readonly string[] | undefined;

export interface InputProps extends Omit<HTMLProps<HTMLInputElement>, "onChange" | "start" | "end" | "value"> {
  type: HTMLInputTypeAttribute;
  onChange: Dispatch<SetStateAction<any>>;
  hidden?: boolean;
  start?: ReactElement;
  end?: ReactElement;
  value?: InputValue | boolean;
  label?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  rules?: Array<(value: string) => string | undefined>;
  onEnter?: () => void;
}

export function Input({
  className = "",
  disabled = false,
  end,
  hidden = false,
  id,
  label,
  onChange,
  onEnter = noop,
  placeholder = "",
  rules = [],
  start,
  type,
  value,
  ...rest
}: InputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [tip, setTip] = useState<string | undefined>("");
  const [isFocus, setIsFocus] = useState(false);

  const hasValue = useMemo(() => {
    if (typeof value === "boolean") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== null && `${value}`.length > 0;
  }, [value]);

  const state = useMemo(() => {
    if (rules.length > 0 && hasValue && tip) {
      return InputState.Error;
    }

    if (rules.length > 0 && hasValue && !tip) {
      return InputState.Correct;
    }

    return InputState.Default;
  }, [hasValue, rules.length, tip]);

  const containerClassName = useMemo(
    () =>
      cn(
        "flex h-full w-full flex-row items-center justify-center rounded-md border",
        disabled
          ? "cursor-not-allowed border-contrast bg-contrast-200 text-contrast-500"
          : hasValue
            ? cn(
                `text-${state}`,
                `border-${state === InputState.Default && isFocus ? "primary" : state}`,
                state === InputState.Default && isFocus ? "shadow-primary-custom" : "shadow-none",
              )
            : "border-contrast text-contrast hover:border-contrast-700",
        state === InputState.Default && !disabled ? "hover:text-black" : undefined,
        label ? "h-min" : undefined,
        className,
      ),
    [className, disabled, hasValue, isFocus, label, state],
  );

  const inputClassName = useMemo(
    () =>
      cn(
        "h-full w-full bg-transparent py-1.5 focus:outline-none file:cursor-pointer file:rounded file:border-none file:bg-primary-100 file:text-black hover:file:bg-primary-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        disabled ? "cursor-not-allowed" : undefined,
        !start ? "pl-2" : undefined,
        !end && type !== "password" ? "pr-2" : undefined,
        hidden ? "hidden" : undefined,
      ),
    [disabled, end, hidden, start, type],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && state !== InputState.Error && !disabled) {
      onEnter();
      event.preventDefault();
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    const nextValue = event.target.value;
    setTip(rules.map((rule) => rule(nextValue)).find((result) => result !== undefined));

    switch (type) {
      case "file":
        onChange(event.target.files);
        return;
      case "checkbox":
        onChange(value !== undefined ? !value : event.target.checked);
        return;
      default:
        onChange(nextValue);
    }
  }

  function handleFocus() {
    setIsFocus(true);

    switch (type) {
      case "date":
      case "datetime-local":
        inputRef.current?.showPicker?.();
        return;
      default:
        return;
    }
  }

  return useMemo(
    () => (
      <div className="relative w-full">
        {label ? <h1 className={cn(`text-${state}`, "self-end px-1 text-base")}>{label}</h1> : null}
        <div className={containerClassName}>
          {start ? <div className="flex cursor-pointer items-center justify-center px-2 text-2xl">{start}</div> : null}
          <input
            {...rest}
            id={id}
            ref={inputRef}
            checked={type === "checkbox" ? Boolean(value) : undefined}
            className={inputClassName}
            disabled={disabled}
            onBlur={() => setIsFocus(false)}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={state === InputState.Default ? placeholder : ""}
            type={type === "password" ? (showPassword ? "text" : "password") : type}
            value={type === "file" || type === "checkbox" ? undefined : (value as InputValue)}
          />
          {end ? <div className="flex cursor-pointer items-center justify-center px-2 text-2xl">{end}</div> : null}
          {type === "password" ? (
            <Icon
              className="flex cursor-pointer items-center justify-center px-2 text-2xl"
              icon={showPassword ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
              onClick={() => setShowPassword((current) => !current)}
            />
          ) : null}
          {state === InputState.Correct && type !== "password" && !end ? (
            <Icon
              className="flex items-center justify-center px-2 text-2xl"
              color="secondary"
              icon={<TaskAltOutlinedIcon />}
            />
          ) : null}
        </div>
        {state === InputState.Error ? (
          <div className="absolute left-0 top-full z-40 flex w-full items-center px-1 py-1">
            <Icon color="quaternary" icon={<WarningAmberOutlinedIcon />} size="sm" />
            <div className="px-1 text-xs text-error">{tip}</div>
          </div>
        ) : null}
      </div>
    ),
    [
      className,
      containerClassName,
      disabled,
      end,
      id,
      inputClassName,
      label,
      placeholder,
      rest,
      showPassword,
      start,
      state,
      tip,
      type,
      value,
    ],
  );
}
