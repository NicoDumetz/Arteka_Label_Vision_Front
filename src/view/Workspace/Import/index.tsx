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
// Created     : Monday May 18 2026
//
// =============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Assets } from "~/api";
import { useWorkspace } from "~/contexts/Workspace";
import { cn } from "~/helpers/Cn";
import { getApiErrorMessage } from "~/helpers/api";
import { getMediaUrl } from "~/helpers/media";
import type { ConfirmFrameCandidatesResponse } from "~/types/api";
import type { Asset, ID, Item } from "~/types/models";

import { FullscreenCandidateModal } from "./components/FullscreenCandidateModal";
import { FullscreenLocalFileModal } from "./components/FullscreenLocalFileModal";
import { LocalFileCard } from "./components/LocalFileCard";
import {
  IMAGE_EXTENSIONS,
  SUPPORTED_EXTENSIONS,
  VIDEO_EXTENSIONS,
  VIDEO_POLL_ATTEMPTS,
  VIDEO_POLL_DELAY_MS,
} from "./constants";
import type { ActiveTabId, FrameCandidateWithSelection, ImportStep } from "./types";
import {
  addOrUpdateCandidate,
  getSelectedCandidateIdsByAsset,
  sortFilesByImportPriority,
} from "./utils";
import { getFileExtension, sleep } from "~/helpers/media";

export default function WorkspaceAssetImport() {
  const { project } = useWorkspace();

  const [files, setFiles] = useState<File[]>([]);
  const [pendingStaticFiles, setPendingStaticFiles] = useState<File[]>([]);
  const [step, setStep] = useState<ImportStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mediaAssets, setMediaAssets] = useState<Asset[]>([]);
  const [createdItems, setCreatedItems] = useState<Item[]>([]);
  const [frameCandidates, setFrameCandidates] = useState<FrameCandidateWithSelection[]>([]);
  const [activeTabId, setActiveTabId] = useState<ActiveTabId>(null);
  const [manualFrameIndex, setManualFrameIndex] = useState("");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [fullscreenCandidate, setFullscreenCandidate] = useState<FrameCandidateWithSelection | null>(null);
  const [fullscreenLocalFile, setFullscreenLocalFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaAssetsRef = useRef<Asset[]>([]);

  useEffect(() => {
    mediaAssetsRef.current = mediaAssets;
  }, [mediaAssets]);

  const activeCandidates = useMemo(
    () => (typeof activeTabId === "number" ? frameCandidates.filter((candidate) => candidate.asset_id === activeTabId) : []),
    [activeTabId, frameCandidates],
  );

  const selectedAsset = typeof activeTabId === "number" ? mediaAssets.find((asset) => asset.id === activeTabId) ?? null : null;
  const selectedAssetUrl = getMediaUrl(
    selectedAsset?.playback_path ?? selectedAsset?.preview_path ?? selectedAsset?.storage_path,
  );
  const selectedFramesCount = frameCandidates.filter((candidate) => candidate.selected).length;
  const selectedReviewCandidates = frameCandidates.filter((candidate) => candidate.selected);
  const canFinalize = pendingStaticFiles.length > 0 || selectedFramesCount > 0;
  const fullscreenLocalFileUrl = useMemo(
    () => (fullscreenLocalFile ? URL.createObjectURL(fullscreenLocalFile) : ""),
    [fullscreenLocalFile],
  );

  useEffect(() => {
    return () => {
      if (fullscreenLocalFileUrl) URL.revokeObjectURL(fullscreenLocalFileUrl);
    };
  }, [fullscreenLocalFileUrl]);

  useEffect(() => {
    if (activeTabId === "images" && pendingStaticFiles.length === 0 && mediaAssets.length > 0) {
      setActiveTabId(mediaAssets[0].id);
      return;
    }

    if (typeof activeTabId === "number" && !mediaAssets.some((asset) => asset.id === activeTabId)) {
      setActiveTabId(pendingStaticFiles.length > 0 ? "images" : mediaAssets[0]?.id ?? null);
    }
  }, [activeTabId, mediaAssets, pendingStaticFiles.length]);

  const cancelMediaAssets = async (assets: Asset[]) => {
    const cancellableAssets = assets.filter((asset) => asset.status !== "archived");
    await Promise.allSettled(cancellableAssets.map((asset) => Assets.cancelImport(asset.id)));
  };

  const resetProcessingState = ({ cancelAssets = false }: { cancelAssets?: boolean } = {}) => {
    if (cancelAssets) {
      void cancelMediaAssets(mediaAssetsRef.current);
    }

    setStep("idle");
    setPendingStaticFiles([]);
    setMediaAssets([]);
    mediaAssetsRef.current = [];
    setCreatedItems([]);
    setFrameCandidates([]);
    setActiveTabId(null);
    setManualFrameIndex("");
    setPlaybackRate(1);
    setUploadProgress(0);
    setError(null);
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const incomingFiles = Array.from(newFiles);
    const supportedFiles = incomingFiles.filter((file) => SUPPORTED_EXTENSIONS.has(getFileExtension(file)));
    const rejectedCount = incomingFiles.length - supportedFiles.length;

    if (supportedFiles.length > 0) {
      resetProcessingState({ cancelAssets: true });
      setFiles((currentFiles) => sortFilesByImportPriority([...currentFiles, ...supportedFiles]));
    }

    if (rejectedCount > 0) {
      setError(`${rejectedCount} fichier(s) ignore(s). Formats supportes: jpg, jpeg, png, webp, mp4, avi, mov, mkv, mpg, mpeg.`);
    } else {
      setError(null);
    }
  };

  const removeFile = (idx: number) => {
    resetProcessingState({ cancelAssets: true });
    setFiles((currentFiles) => currentFiles.filter((_, index) => index !== idx));
  };

  const waitForVideoReady = async (asset: Asset) => {
    let currentAsset = asset;

    for (let attempt = 0; attempt < VIDEO_POLL_ATTEMPTS; attempt += 1) {
      if (currentAsset.status === "ready" || currentAsset.status === "failed" || currentAsset.status === "archived") {
        return currentAsset;
      }

      await sleep(VIDEO_POLL_DELAY_MS);

      const response = await Assets.get(asset.id);
      currentAsset = response.data;
      setMediaAssets((currentAssets) => {
        return currentAssets.map((current) => (current.id === currentAsset.id ? currentAsset : current));
      });
      setStatusMessage(`Traitement de ${asset.filename} (${attempt + 1})`);
    }

    return currentAsset;
  };

  const loadFrameCandidates = async (asset: Asset) => {
    const response = await Assets.listFrameCandidates(asset.id);
    const nextCandidates = response.data.map<FrameCandidateWithSelection>((candidate) => ({
      ...candidate,
      selected: candidate.selected_by_default,
    }));

    setFrameCandidates((currentCandidates) => {
      return nextCandidates.reduce(
        (accumulator, candidate) => addOrUpdateCandidate(accumulator, candidate, candidate.selected),
        currentCandidates,
      );
    });

    return nextCandidates;
  };

  const handleProcess = async () => {
    if (files.length === 0 || !project) return;

    setError(null);
    setStatusMessage(null);
    setUploadProgress(0);
    setMediaAssets([]);
    mediaAssetsRef.current = [];
    setCreatedItems([]);
    setFrameCandidates([]);
    setActiveTabId(null);

    const imageFiles = files.filter((file) => IMAGE_EXTENSIONS.has(getFileExtension(file)));
    const videoFiles = files.filter((file) => VIDEO_EXTENSIONS.has(getFileExtension(file)));
    const uploadedVideoAssets: Asset[] = [];

    try {
      setPendingStaticFiles(imageFiles);

      if (imageFiles.length > 0 && videoFiles.length === 0) {
        setStep("review");
        setActiveTabId("images");
        setStatusMessage("Images pretes. Verifie le recap avant upload.");
        return;
      }

      setStep("processing");

      for (let index = 0; index < videoFiles.length; index += 1) {
        const file = videoFiles[index];
        setStatusMessage(`Upload video ${index + 1}/${videoFiles.length}: ${file.name}`);
        setUploadProgress(Math.round(((index + 1) / Math.max(videoFiles.length, 1)) * 100));

        const response = await Assets.upload(project.id, { file });
        const uploadedAsset = response.data.asset;

        if (uploadedAsset.media_type !== "video") {
          continue;
        }

        uploadedVideoAssets.push(uploadedAsset);
        mediaAssetsRef.current = [...mediaAssetsRef.current, uploadedAsset];
        setMediaAssets((currentAssets) => [...currentAssets, uploadedAsset]);

        const readyAsset = await waitForVideoReady(uploadedAsset);

        if (readyAsset.status === "ready") {
          mediaAssetsRef.current = mediaAssetsRef.current.map((asset) => (asset.id === readyAsset.id ? readyAsset : asset));
          setMediaAssets((currentAssets) => currentAssets.map((asset) => (asset.id === readyAsset.id ? readyAsset : asset)));
          await loadFrameCandidates(readyAsset);
        } else if (readyAsset.status === "failed") {
          throw new Error(readyAsset.processing_error || `La video "${readyAsset.filename}" a echoue pendant le traitement.`);
        } else {
          throw new Error("La video est encore en traitement. Verifie que le worker backend est lance.");
        }
      }

      if (uploadedVideoAssets.length > 0 || imageFiles.length > 0) {
        setStep("curation");
        setActiveTabId(uploadedVideoAssets[0]?.id ?? "images");
        setStatusMessage("Analyse terminee. Verifie les images et les frames avant upload.");
      } else {
        setStep("idle");
      }
    } catch (err) {
      await cancelMediaAssets(mediaAssetsRef.current.length > 0 ? mediaAssetsRef.current : uploadedVideoAssets);
      mediaAssetsRef.current = [];
      setMediaAssets([]);
      setFrameCandidates([]);
      setPendingStaticFiles([]);
      setActiveTabId(null);
      setStep("idle");
      setError(getApiErrorMessage(err, "Processing failed. Please check file formats and backend availability."));
    } finally {
      setUploadProgress(0);
    }
  };

  const toggleFrame = (id: ID) => {
    setFrameCandidates((currentCandidates) => {
      return currentCandidates.map((candidate) => (
        candidate.id === id ? { ...candidate, selected: !candidate.selected } : candidate
      ));
    });
  };

  const addManualCandidate = async (payload: { frame_index?: number; timestamp_ms?: number }) => {
    if (!selectedAsset) return;

    setIsCapturing(true);
    setError(null);

    try {
      const response = await Assets.createManualFrameCandidate(selectedAsset.id, payload);

      setFrameCandidates((currentCandidates) => addOrUpdateCandidate(currentCandidates, response.data, true));
      setManualFrameIndex("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de creer une frame candidate manuelle."));
    } finally {
      setIsCapturing(false);
    }
  };

  const handleManualCapture = async () => {
    if (!videoRef.current || !selectedAsset) return;

    const timestampMs = Math.floor(videoRef.current.currentTime * 1000);
    await addManualCandidate({ timestamp_ms: timestampMs });
  };

  const handleManualFrameIndexCapture = async () => {
    const frameIndex = manualFrameIndex.trim() ? Number(manualFrameIndex) : null;

    if (frameIndex === null || !Number.isInteger(frameIndex) || frameIndex < 0) {
      setError("Entre un frame_index valide avant de capturer une frame.");
      return;
    }

    await addManualCandidate({ frame_index: frameIndex });
  };

  const seekVideoByFrames = (frameDelta: number) => {
    const video = videoRef.current;
    if (!video || !selectedAsset) return;

    const fps = selectedAsset.fps && selectedAsset.fps > 0 ? selectedAsset.fps : 25;
    video.currentTime = Math.max(0, video.currentTime + frameDelta / fps);
  };

  const setVideoPlaybackRate = (nextRate: number) => {
    setPlaybackRate(nextRate);
    if (videoRef.current) videoRef.current.playbackRate = nextRate;
  };

  const handleCancelImport = async () => {
    setIsFinalizing(true);
    setError(null);

    try {
      await cancelMediaAssets(mediaAssetsRef.current);
      resetProcessingState({ cancelAssets: false });
      setFiles([]);
      setStatusMessage("Import annule.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'annuler l'import."));
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleFinishSelection = () => {
    setCreatedItems([]);
    setStep("review");
    setStatusMessage("Recap pret. Clique sur Upload pour creer les items.");
  };

  const handleCompleteUpload = async () => {
    if (!project || !canFinalize) return;

    const selectedByAsset = getSelectedCandidateIdsByAsset(frameCandidates);
    const entries = Object.entries(selectedByAsset);
    const nextCreatedItems: Item[] = [];
    const responses: ConfirmFrameCandidatesResponse[] = [];

    setIsFinalizing(true);
    setError(null);
    setStatusMessage("Upload en cours...");
    setUploadProgress(0);

    try {
      for (let index = 0; index < entries.length; index += 1) {
        const [assetId, candidateIds] = entries[index];
        if (candidateIds.length === 0) continue;

        const response = await Assets.confirmFrameCandidates(Number(assetId), { candidate_ids: candidateIds });

        responses.push(response.data);
        nextCreatedItems.push(...response.data.items);
        setUploadProgress(Math.round(((index + 1) / Math.max(entries.length + pendingStaticFiles.length, 1)) * 100));
      }

      for (let index = 0; index < pendingStaticFiles.length; index += 1) {
        const file = pendingStaticFiles[index];
        setStatusMessage(`Upload image ${index + 1}/${pendingStaticFiles.length}: ${file.name}`);

        const response = await Assets.upload(project.id, { file });
        nextCreatedItems.push(...response.data.items);
        setUploadProgress(Math.round(((entries.length + index + 1) / Math.max(entries.length + pendingStaticFiles.length, 1)) * 100));
      }

      setCreatedItems(nextCreatedItems);
      resetProcessingState({ cancelAssets: false });
      setFiles([]);
      setStatusMessage(`Upload termine: ${nextCreatedItems.length} item(s) cree(s).`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de finaliser l'upload."));
    } finally {
      setIsFinalizing(false);
      setUploadProgress(0);
    }

    return responses;
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full overflow-hidden bg-[#08080c]">
      <aside className="z-20 flex w-[400px] shrink-0 flex-col border-r border-white/5 bg-[#0a0a0f] shadow-xl">
        <div className="border-b border-white/5 bg-white/[0.02] p-8">
          <p className="mb-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-400">
            Orchestration
          </p>
          <h1 className="text-2xl font-manrope-extrabold tracking-tight text-white">
            Data Ingestion
          </h1>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            <div>
              <h2 className="mb-3 flex items-center gap-2 border-l-2 border-primary-500 pl-3 text-[10px] font-mono font-bold uppercase tracking-widest text-white">
                Source Files
              </h2>
              <label
                className={cn(
                  "group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all",
                  files.length === 0 ? "h-40 border-white/10 bg-white/[0.02] hover:border-primary-500/50 hover:bg-white/[0.04]" : "h-20 border-primary-500/30 bg-primary-500/5",
                  isDragOver && "scale-[0.98] border-primary-500 bg-primary-500/10",
                )}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  handleFiles(event.dataTransfer.files);
                }}
              >
                <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                  <svg className={`transition-colors ${files.length === 0 ? "h-8 w-8 text-white/30 group-hover:text-primary-400" : "h-6 w-6 text-primary-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {files.length === 0 && (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 transition-colors group-hover:text-white">
                      Drop Media Here
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.mp4,.avi,.mov,.mkv,.mpg,.mpeg"
                  className="hidden"
                  onChange={(event) => event.target.files && handleFiles(event.target.files)}
                />
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={`${file.name}-${file.lastModified}-${index}`} className="group flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-3 transition-colors hover:border-white/10">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[8px] font-black uppercase text-white/50">
                        {getFileExtension(file)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-white">{file.name}</p>
                        <p className="text-[9px] font-mono text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="p-2 text-white/30 transition-colors hover:text-error">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(pendingStaticFiles.length > 0 || mediaAssets.length > 0) && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-3 text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">Draft Import</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-2xl font-manrope-extrabold text-white">{pendingStaticFiles.length}</div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/35">Static pending</div>
                  </div>
                  <div>
                    <div className="text-2xl font-manrope-extrabold text-primary-300">{mediaAssets.length}</div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/35">Video assets</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/5 bg-black/20 p-8">
          {error && <p className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3 text-[10px] font-mono text-error">{error}</p>}
          {statusMessage && <p className="mb-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-[10px] font-mono text-primary-200">{statusMessage}</p>}
          {step === "processing" || isFinalizing ? (
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-[10px] font-mono font-bold text-white/50">
                <span>PROGRESS</span>
                <span className="text-primary-400">{uploadProgress}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : null}
          <button
            disabled={
              isFinalizing
              || step === "processing"
              || (step === "idle" && files.length === 0)
              || ((step === "curation" || step === "review") && !canFinalize)
            }
            onClick={() => {
              if (step === "curation") {
                handleFinishSelection();
                return;
              }
              if (step === "review") {
                void handleCompleteUpload();
                return;
              }
              void handleProcess();
            }}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-white px-4 py-4 text-[10px] font-manrope-extrabold uppercase tracking-widest text-black transition-all hover:bg-primary-100 disabled:opacity-50"
          >
            {step === "processing" ? "Analyzing..." : step === "curation" ? "Review Import" : step === "review" ? (isFinalizing ? "Uploading..." : "Upload Selected") : "Process Assets"}
          </button>
          {(step === "processing" || step === "curation" || step === "review") && (mediaAssets.length > 0 || pendingStaticFiles.length > 0) ? (
            <button
              type="button"
              disabled={isFinalizing}
              onClick={() => void handleCancelImport()}
              className="mt-3 flex w-full items-center justify-center rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-[10px] font-manrope-extrabold uppercase tracking-widest text-error transition-colors hover:bg-error/15 disabled:opacity-50"
            >
              Cancel Draft Import
            </button>
          ) : null}
        </div>
      </aside>

      <section className="relative flex min-w-0 flex-1 flex-col bg-[#0c0c11]">
        {step === "idle" && (
          files.length > 0 ? (
            <div className="flex h-full flex-col">
              <div className="shrink-0 border-b border-white/5 bg-white/[0.01] px-10 py-6">
                <h2 className="text-xl font-manrope-extrabold uppercase tracking-widest text-white">Selected Source Assets</h2>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-white/40">
                  {files.length} file{files.length > 1 ? "s" : ""} ready for processing
                </p>
              </div>
              <div className="flex-1 overflow-x-auto overflow-y-hidden px-10 py-10">
                <div className="flex h-full items-center gap-6">
                  {files.map((file, index) => (
                    <LocalFileCard
                      key={`${file.name}-${file.lastModified}-${index}`}
                      file={file}
                      onRemove={() => removeFile(index)}
                      onPreview={IMAGE_EXTENSIONS.has(getFileExtension(file)) ? setFullscreenLocalFile : undefined}
                      className="h-[40rem]"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
              <svg className="mb-6 h-16 w-16 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h2 className="text-xl font-manrope-extrabold uppercase tracking-widest text-white">System Standby</h2>
              <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">Waiting for media input</p>
            </div>
          )
        )}

        {step === "processing" && (
          <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1),transparent_50%)]">
            <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full border border-primary-500/30" />
              <div className="absolute inset-4 animate-spin-slow rounded-full border border-primary-500/50 border-t-transparent" />
              <svg className="h-10 w-10 animate-pulse text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h2 className="text-2xl font-manrope-extrabold uppercase tracking-widest text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              Uploading Videos & Extracting
            </h2>
            <p className="mt-8 max-w-md text-center text-xs font-mono uppercase tracking-widest text-white/35">
              Static images stay local until the final upload.
            </p>
          </div>
        )}

        {step === "curation" && (
          <div className="flex h-full flex-col animate-in fade-in zoom-in-95 duration-500">
            <div className="flex shrink-0 flex-col border-b border-white/10 bg-[#0a0a0f]">
              <div className="flex items-center justify-between px-8 py-5">
                <div>
                  <h2 className="text-xl font-manrope-extrabold uppercase tracking-widest text-white">Import Workspace</h2>
                  <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/40">
                    Validate static images and sequence frames before upload.
                  </p>
                </div>
                {mediaAssets.length > 0 ? (
                  <div className="text-right">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-primary-300">Frames Selected</p>
                    <p className="mt-1 text-xl font-mono font-bold leading-none text-white">
                      {selectedFramesCount} <span className="text-xs text-white/35">/ {frameCandidates.length}</span>
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex items-end gap-2 overflow-x-auto px-8 pt-3">
                {mediaAssets.map((asset) => {
                  const assetSelectionCount = frameCandidates.filter((candidate) => candidate.asset_id === asset.id && candidate.selected).length;

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setActiveTabId(asset.id)}
                      className={cn(
                        "flex min-w-[200px] flex-col items-start gap-1 rounded-t-xl border-b-2 px-4 py-3 transition-all",
                        activeTabId === asset.id ? "border-primary-500 bg-primary-500/10 text-white" : "border-transparent text-white/40 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className="w-full truncate text-left text-[10px] font-black uppercase tracking-widest">{asset.original_filename || asset.filename}</span>
                      <span className="text-[9px] font-mono">{assetSelectionCount} frames selected</span>
                    </button>
                  );
                })}

                {pendingStaticFiles.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTabId("images")}
                    className={cn(
                      "flex min-w-[180px] flex-col items-start gap-1 rounded-t-xl border-b-2 px-4 py-3 transition-all",
                      activeTabId === "images" ? "border-primary-500 bg-primary-500/10 text-white" : "border-transparent text-white/40 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <span className="w-full truncate text-left text-[10px] font-black uppercase tracking-widest">Static Images</span>
                    <span className="text-[9px] font-mono text-emerald-300">{pendingStaticFiles.length} pending</span>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex min-h-0 flex-1">
              {activeTabId === "images" && (
                <div className="no-scrollbar flex-1 overflow-y-auto p-10">
                  <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                    <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-white">Static Images Pending</h3>
                      <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/40">
                        These images will only upload after final validation.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pb-20 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {pendingStaticFiles.map((file, index) => (
                      <LocalFileCard
                        key={`${file.name}-${file.lastModified}-${index}`}
                        file={file}
                        className="min-w-0"
                        variant="square"
                        onPreview={setFullscreenLocalFile}
                        onRemove={() => setPendingStaticFiles((currentFiles) => currentFiles.filter((_, currentIndex) => currentIndex !== index))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {typeof activeTabId === "number" && selectedAsset && (
                <div className="flex min-h-0 flex-1">
                  <div className="flex w-[45%] min-w-[340px] shrink-0 flex-col border-r border-white/5 bg-[#050508] p-6 shadow-[inset_-20px_0_40px_rgba(0,0,0,0.5)]">
                    <div className="mb-4 flex items-center justify-between gap-2 text-primary-400">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Manual Studio</span>
                      </div>
                    </div>

                    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">
                      {selectedAssetUrl ? (
                        <video
                          key={selectedAsset.id}
                          ref={videoRef}
                          src={selectedAssetUrl}
                          controls
                          muted
                          preload="metadata"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] font-mono text-white/30">No preview</span>
                      )}
                    </div>

                    <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[10px] font-mono uppercase tracking-widest text-white/40">
                      Status: <span className="text-white/70">{selectedAsset.status}</span>
                      <span className="mx-2 text-white/20">/</span>
                      Frames: <span className="text-white/70">{selectedAsset.frame_count ?? "--"}</span>
                    </div>

                    <div className="mt-6 space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={isCapturing}
                          onClick={() => void handleManualCapture()}
                          className="rounded-lg bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
                        >
                          {isCapturing ? "Capturing..." : "Capture Current"}
                        </button>
                        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
                          {[0.25, 0.5, 1, 2].map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              onClick={() => setVideoPlaybackRate(rate)}
                              className={cn(
                                "rounded-md px-2 py-1.5 text-[9px] font-black uppercase tracking-widest transition",
                                playbackRate === rate ? "bg-primary-500/30 text-primary-200" : "text-white/45 hover:bg-white/10 hover:text-white",
                              )}
                            >
                              {rate === 1 ? "Normal" : `${rate}x`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-2">
                        <button type="button" onClick={() => seekVideoByFrames(-1)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-black text-white/60 hover:text-white">-1</button>
                        <button type="button" onClick={() => seekVideoByFrames(1)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-black text-white/60 hover:text-white">+1</button>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => seekVideoByFrames(-5)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-black text-white/60 hover:text-white">-5</button>
                          <button type="button" onClick={() => seekVideoByFrames(5)} className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-black text-white/60 hover:text-white">+5</button>
                        </div>
                      </div>

                      <label className="block text-[9px] font-mono uppercase tracking-widest text-white/40">Extract Frame by Index</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="e.g. 42"
                          value={manualFrameIndex}
                          onChange={(event) => setManualFrameIndex(event.target.value)}
                          className="flex-1 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-mono text-white outline-none focus:border-primary-500"
                        />
                        <button
                          type="button"
                          disabled={isCapturing || !manualFrameIndex.trim()}
                          onClick={() => void handleManualFrameIndexCapture()}
                          className="rounded-lg bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
                        >
                          Extract
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="no-scrollbar flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.02),transparent)] p-8">
                    <div className="mb-6 flex justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Extracted Candidates</h3>
                      <span className="text-[10px] font-mono text-white/40">{activeCandidates.length} frames found</span>
                    </div>

                    {activeCandidates.length === 0 ? (
                      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-center text-xs font-mono uppercase tracking-widest text-white/35">
                        No frame candidates yet. If the video is still processing, check that the backend worker is running.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                        {activeCandidates.map((frame) => {
                          const frameUrl = getMediaUrl(frame.preview_path ?? frame.frame_path);
                          const isManual = frame.selection_source === "manual";

                          return (
                            <div
                              key={frame.id}
                              onClick={() => toggleFrame(frame.id)}
                              className={cn(
                                "group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border transition-all",
                                frame.selected ? "scale-[0.98] border-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.15)]" : "border-white/10 bg-white/[0.02] hover:border-white/30",
                                isManual && !frame.selected && "border-primary-500/40 bg-primary-500/5",
                              )}
                            >
                              {frameUrl ? (
                                <img src={frameUrl} alt={`Frame ${frame.frame_index}`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/20">
                                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                              <div className="absolute left-3 top-3 flex flex-col gap-2">
                                <div className="rounded border border-white/10 bg-black/60 px-2 py-1 text-[8px] font-mono uppercase text-white/70 backdrop-blur-md">
                                  FRM_{frame.frame_index.toString().padStart(4, "0")}
                                </div>
                                <div className={cn(
                                  "w-fit rounded border px-2 py-1 text-[8px] font-black uppercase tracking-widest",
                                  isManual ? "border-primary-400/50 bg-primary-500/30 text-primary-300" : "border-white/10 bg-black/60 text-white/45",
                                )}>
                                  {isManual ? "MANUAL" : "AUTO"}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setFullscreenCandidate(frame);
                                }}
                                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/60 opacity-0 backdrop-blur-md transition hover:border-primary-500/50 hover:text-white group-hover:opacity-100"
                                title="Preview"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                              </button>
                              <div className="absolute bottom-3 right-3">
                                <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border transition-all", frame.selected ? "border-emerald-400 bg-emerald-500/20 text-emerald-400" : "border-white/20 bg-black/40 text-transparent group-hover:border-white/50")}>
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="no-scrollbar h-full overflow-y-auto p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex items-end justify-between border-b border-white/5 pb-6">
              <div>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-secondary-300">Final Recap</p>
                <h2 className="text-3xl font-manrope-extrabold tracking-tight text-white">Review Before Upload</h2>
                <p className="mt-2 text-[11px] font-mono uppercase tracking-widest text-white/40">
                  {pendingStaticFiles.length + selectedReviewCandidates.length} media selected for final upload
                </p>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="text-3xl font-manrope-extrabold text-white">{pendingStaticFiles.length}</div>
                <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/35">Images pending</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="text-3xl font-manrope-extrabold text-emerald-300">{selectedReviewCandidates.length}</div>
                <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/35">Frames selected</div>
              </div>
              <div className="rounded-2xl border border-primary-500/20 bg-primary-500/10 p-5">
                <div className="text-3xl font-manrope-extrabold text-white">{pendingStaticFiles.length + selectedReviewCandidates.length}</div>
                <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-primary-200">Total</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {pendingStaticFiles.map((file, index) => (
                <LocalFileCard
                  key={`${file.name}-${file.lastModified}-${index}`}
                  file={file}
                  className="min-w-0"
                  variant="square"
                  onPreview={setFullscreenLocalFile}
                  onRemove={() => setPendingStaticFiles((currentFiles) => currentFiles.filter((_, currentIndex) => currentIndex !== index))}
                />
              ))}
              {selectedReviewCandidates.map((frame) => {
                const frameUrl = getMediaUrl(frame.preview_path ?? frame.frame_path);
                const isManual = frame.selection_source === "manual";

                return (
                  <article key={frame.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                    {frameUrl ? (
                      <img src={frameUrl} alt={`Frame ${frame.frame_index}`} className="absolute inset-0 h-full w-full object-cover" />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/40" />
                    <div className="absolute left-3 top-3 flex flex-col gap-2">
                      <span className="rounded-md border border-white/10 bg-black/60 px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-white/70">
                        FRM_{frame.frame_index.toString().padStart(4, "0")}
                      </span>
                      <span className={cn(
                        "w-fit rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-widest",
                        isManual ? "border-primary-400/50 bg-primary-500/30 text-primary-300" : "border-white/10 bg-black/60 text-white/45",
                      )}>
                        {isManual ? "MANUAL" : "AUTO"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFullscreenCandidate(frame)}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/60 backdrop-blur-md transition hover:border-primary-500/50 hover:text-white"
                      title="Preview"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFrame(frame.id)}
                      className="absolute right-3 top-14 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/60 backdrop-blur-md transition hover:border-error/40 hover:bg-error/20 hover:text-error"
                      title="Remove"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </article>
                );
              })}
            </div>

            {createdItems.length > 0 ? (
              <div className="mt-10">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Created Items</h3>
                  {project ? (
                    <div className="flex gap-3">
                      <Link to={`/workspaces/${project.id}/items`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-white/70 transition-colors hover:bg-white/10">
                        Aller aux items
                      </Link>
                      <Link to={`/workspaces/${project.id}/annotate`} className="rounded-xl bg-white px-4 py-2.5 text-xs font-manrope-extrabold uppercase tracking-widest text-black transition-colors hover:bg-primary-100">
                        Aller a l'annotation
                      </Link>
                    </div>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                  {createdItems.map((item) => {
                    const itemUrl = getMediaUrl(item.preview_path ?? item.file_path);

                    return (
                      <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                        <div className="aspect-square bg-black/40">
                          {itemUrl ? (
                            <img src={itemUrl} alt={`Item ${item.id}`} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="p-3">
                          <div className="text-[10px] font-mono uppercase tracking-widest text-white/50">Item #{item.id}</div>
                          <div className="mt-1 text-[9px] font-mono uppercase tracking-widest text-primary-300">{item.status}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {fullscreenCandidate ? (
        <FullscreenCandidateModal
          candidate={fullscreenCandidate}
          onClose={() => setFullscreenCandidate(null)}
        />
      ) : null}

      {fullscreenLocalFile && fullscreenLocalFileUrl ? (
        <FullscreenLocalFileModal
          file={fullscreenLocalFile}
          fileUrl={fullscreenLocalFileUrl}
          onClose={() => setFullscreenLocalFile(null)}
        />
      ) : null}
    </div>
  );
}
