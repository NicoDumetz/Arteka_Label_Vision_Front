import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Metadata } from "~/api";
import { useAuth } from "~/contexts/Auth";
import type {
  MetadataExportFormatsResponse,
  MetadataMediaTypesResponse,
  MetadataModelFileTypesResponse,
  MetadataModelOutputModesResponse,
  MetadataModelOutputValuesResponse,
  MetadataStatusesResponse,
  MetadataTaskTypesResponse,
} from "~/types/api";

interface MetadataState {
  taskTypes: MetadataTaskTypesResponse | null;
  statuses: MetadataStatusesResponse | null;
  modelOutputModes: MetadataModelOutputModesResponse | null;
  modelOutputValues: MetadataModelOutputValuesResponse | null;
  mediaTypes: MetadataMediaTypesResponse | null;
  modelFileTypes: MetadataModelFileTypesResponse | null;
  exportFormats: MetadataExportFormatsResponse | null;
}

interface MetadataContextValue extends MetadataState {
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const MetadataContext = createContext<MetadataContextValue | undefined>(undefined);

const INITIAL_STATE: MetadataState = {
  taskTypes: null,
  statuses: null,
  modelOutputModes: null,
  modelOutputValues: null,
  mediaTypes: null,
  modelFileTypes: null,
  exportFormats: null,
};

export function MetadataProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();

  const [state, setState] = useState<MetadataState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    const [
      taskTypesResponse,
      statusesResponse,
      modelOutputModesResponse,
      modelOutputValuesResponse,
      mediaTypesResponse,
      modelFileTypesResponse,
      exportFormatsResponse,
    ] = await Promise.all([
      Metadata.taskTypes(),
      Metadata.statuses(),
      Metadata.modelOutputModes(),
      Metadata.modelOutputValues(),
      Metadata.mediaTypes(),
      Metadata.modelFileTypes(),
      Metadata.exportFormats(),
    ]);

    setState({
      taskTypes: taskTypesResponse.data,
      statuses: statusesResponse.data,
      modelOutputModes: modelOutputModesResponse.data,
      modelOutputValues: modelOutputValuesResponse.data,
      mediaTypes: mediaTypesResponse.data,
      modelFileTypes: modelFileTypesResponse.data,
      exportFormats: exportFormatsResponse.data,
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadMetadata() {
      if (!isAuthenticated) {
        setState(INITIAL_STATE);
        return;
      }

      setIsLoading(true);

      try {
        await refresh();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadMetadata();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, refresh]);

  const value = useMemo<MetadataContextValue>(
    () => ({
      ...state,
      isLoading,
      refresh,
    }),
    [state, isLoading, refresh],
  );

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
}

export function useMetadata() {
  const context = useContext(MetadataContext);

  if (!context) {
    throw new Error("useMetadata must be used within a MetadataProvider");
  }

  return context;
}
