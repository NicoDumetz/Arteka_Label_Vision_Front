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

import { useRouteError } from "react-router-dom";

export default function NotFound() {
  const error = useRouteError() as { status?: number; statusText?: string } | null;
  const status = error?.status ?? 404;
  const title = status === 404 ? "Page not found" : "An error has occurred";

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <section className="max-w-md text-center">
        <p className="text-sm font-medium text-neutral-500">{status}</p>
        <h1 className="mt-3 text-3xl font-semibold text-neutral-950">{title}</h1>
        <p className="mt-4 text-neutral-600">
          The requested page does not exist or is no longer available.
        </p>
      </section>
    </main>
  );
}
