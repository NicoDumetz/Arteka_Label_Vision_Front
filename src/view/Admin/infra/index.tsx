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

import { useEffect, useState } from "react";

import { Storage } from "~/api";
import type { MaintenanceResponse } from "~/api/Storage";
import { getApiErrorMessage } from "~/helpers/api";

type MaintenanceKey = "tmp" | "pending_delete" | "consistency";
type MaintenanceState = Partial<Record<MaintenanceKey, MaintenanceResponse>>;

const MAINTENANCE_LABELS: Record<MaintenanceKey, string> = {
  tmp: "Temporary cleanup",
  pending_delete: "Pending delete cleanup",
  consistency: "Storage consistency",
};

function getMetricValue(response: MaintenanceResponse | undefined, keys: string[]) {
  if (!response) return "N/A";

  for (const key of keys) {
    const value = response[key];
    if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
      return String(value);
    }
  }

  return "N/A";
}

export default function AdminInfraPage() {
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>({});
  const [lastResult, setLastResult] = useState<{ label: string; response: MaintenanceResponse } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<MaintenanceKey | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadDryRunStats() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [tmpResponse, pendingDeleteResponse, consistencyResponse] = await Promise.all([
        Storage.cleanupTmp({ dry_run: true }),
        Storage.cleanupPendingDelete({ dry_run: true }),
        Storage.checkConsistency({
          dry_run: true,
          scan_orphans: true,
          mark_missing: false,
          mark_orphans: false,
        }),
      ]);

      setMaintenanceState({
        tmp: tmpResponse.data,
        pending_delete: pendingDeleteResponse.data,
        consistency: consistencyResponse.data,
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load infrastructure status."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDryRunStats();
  }, []);

  async function runMaintenance(key: MaintenanceKey) {
    setRunningAction(key);
    setErrorMessage(null);

    try {
      const response =
        key === "tmp"
          ? await Storage.cleanupTmp({ dry_run: false })
          : key === "pending_delete"
            ? await Storage.cleanupPendingDelete({ dry_run: false })
            : await Storage.checkConsistency({
                dry_run: false,
                scan_orphans: true,
                mark_missing: true,
                mark_orphans: true,
              });

      setLastResult({ label: MAINTENANCE_LABELS[key], response: response.data });
      await loadDryRunStats();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, `Unable to run ${MAINTENANCE_LABELS[key].toLowerCase()}.`));
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-manrope-extrabold tracking-tight text-white">Infrastructure & Fleet</h1>
          <p className="mt-2 text-sm font-manrope-medium text-white/50">Monitor backend maintenance jobs and storage consistency.</p>
        </div>
        <button
          type="button"
          onClick={loadDryRunStats}
          disabled={isLoading}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-manrope-medium text-error">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md">
          <h2 className="mb-6 text-sm font-mono font-bold uppercase tracking-widest text-white/70">Temporary Files</h2>
          <div className="mb-8 flex items-end gap-4">
            <div className="text-5xl font-manrope-extrabold tracking-tighter text-primary-300">
              {getMetricValue(maintenanceState.tmp, ["deleted_count", "matched_count", "count"])}
            </div>
            <div className="mb-2 text-xs font-mono uppercase tracking-widest text-white/40">Candidates</div>
          </div>
          <button
            type="button"
            onClick={() => runMaintenance("tmp")}
            disabled={runningAction !== null}
            className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black disabled:opacity-50"
          >
            {runningAction === "tmp" ? "Running..." : "Cleanup Tmp"}
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md">
          <h2 className="mb-6 text-sm font-mono font-bold uppercase tracking-widest text-white/70">Pending Deletes</h2>
          <div className="mb-8 flex items-end gap-4">
            <div className="text-5xl font-manrope-extrabold tracking-tighter text-quaternary-300">
              {getMetricValue(maintenanceState.pending_delete, ["deleted_count", "processed_count", "count"])}
            </div>
            <div className="mb-2 text-xs font-mono uppercase tracking-widest text-white/40">Files</div>
          </div>
          <button
            type="button"
            onClick={() => runMaintenance("pending_delete")}
            disabled={runningAction !== null}
            className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black disabled:opacity-50"
          >
            {runningAction === "pending_delete" ? "Running..." : "Cleanup Pending"}
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md">
          <h2 className="mb-6 text-sm font-mono font-bold uppercase tracking-widest text-white/70">Consistency</h2>
          <div className="mb-8 flex items-end gap-4">
            <div className="text-5xl font-manrope-extrabold tracking-tighter text-secondary-300">
              {getMetricValue(maintenanceState.consistency, ["orphan_count", "missing_count", "checked_count", "count"])}
            </div>
            <div className="mb-2 text-xs font-mono uppercase tracking-widest text-white/40">Findings</div>
          </div>
          <button
            type="button"
            onClick={() => runMaintenance("consistency")}
            disabled={runningAction !== null}
            className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white transition-all hover:bg-white hover:text-black disabled:opacity-50"
          >
            {runningAction === "consistency" ? "Running..." : "Check & Mark"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md">
        <h2 className="mb-4 text-sm font-mono font-bold uppercase tracking-widest text-white/70">Last Maintenance Response</h2>
        <pre className="max-h-96 overflow-auto rounded-2xl border border-white/5 bg-black/40 p-4 text-xs leading-relaxed text-white/60">
          {lastResult ? `${lastResult.label}\n${JSON.stringify(lastResult.response, null, 2)}` : "No maintenance action executed yet."}
        </pre>
      </div>
    </div>
  );
}
