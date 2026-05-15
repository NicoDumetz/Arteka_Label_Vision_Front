export function setBodyScrollLocked(locked: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  document.body.style.overflow = locked ? "hidden" : "";
}
