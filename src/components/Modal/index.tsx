import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { useEffect, useMemo } from "react";

import { Icon } from "../Icon";
import { cn } from "../../helpers/Cn";
import { noop } from "../../helpers/Fn";
import { setBodyScrollLocked } from "../../helpers/ScrollLock";

export interface ModalProps extends PropsWithChildren {
  open: boolean;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  className?: string;
  closeOnOverlayClick?: boolean;
}

export function Modal({
  children,
  className,
  closeOnOverlayClick = true,
  open,
  setOpen,
}: ModalProps) {
  useEffect(() => {
    setBodyScrollLocked(open);

    return () => {
      setBodyScrollLocked(false);
    };
  }, [open]);

  const close = () => {
    if (!setOpen) {
      noop();
      return;
    }

    setOpen(false);
  };

  const content = useMemo(
    () => (
      !open ? null :
    <div
      className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={closeOnOverlayClick ? close : undefined}
      role="presentation"
    >
      <div
        className={cn(
          "relative w-full max-w-3xl rounded-2xl border border-contrast-200 bg-white p-6 shadow-2xl",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          aria-label="Fermer la modale"
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-contrast-500 transition hover:bg-contrast-100 hover:text-dark"
          onClick={close}
          type="button"
        >
          <Icon icon={<CloseRoundedIcon />} />
        </button>
        {children}
      </div>
    </div>
    ),
    [children, className, closeOnOverlayClick, open, setOpen],
  );

  return content;
}
