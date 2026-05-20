// =============================================================
//
// ██╗  ██╗███████╗██╗  ██╗██╗ █████╗
// ██║  ██║██╔════╝██║ ██╔╝██║██╔══██╗
// ███████║█████╗  █████╔╝ ██║███████║
// ██╔══██║██╔══╝  ██╔═██╗ ██║██╔══██║
// ██║  ██║███████╗██║  ██╗██║██║  ██║
// ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
//
// File        : constants.ts
// Project     : Arteka_Label_Vision_Front
// Author      : Nicolas Dumetz
//
// Created     : Monday May 18 2026
//
// =============================================================

export const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
export const VIDEO_EXTENSIONS = new Set(["mp4", "avi", "mov", "mkv", "mpg", "mpeg"]);
export const SUPPORTED_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);
export const VIDEO_POLL_ATTEMPTS = 150;
export const VIDEO_POLL_DELAY_MS = 1500;
