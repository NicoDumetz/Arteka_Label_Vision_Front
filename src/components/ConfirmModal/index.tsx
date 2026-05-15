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

import type { ReactNode } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  type: "delete" | "archive" | "warning";
  title: string;
  message: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({ isOpen, type, title, message, onConfirm, onClose, isLoading }: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDelete = type === "delete";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c11] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        
        {isDelete && (
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-error/20 blur-3xl pointer-events-none" />
        )}

        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
          {isDelete ? (
            <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-quaternary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          )}
        </div>

        <h3 className="mb-2 text-xl font-manrope-extrabold text-white">{title}</h3>
        <p className="mb-8 text-sm font-manrope-medium leading-relaxed text-white/50">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 ${
              isDelete
                ? "bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white shadow-[0_0_15px_rgba(255,0,77,0.2)]"
                : "bg-white text-background hover:bg-primary-100 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            }`}
          >
            {isLoading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}