"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Square, ArrowUp, X, SlidersHorizontal } from "lucide-react";
import type { SearchMode } from "@/lib/types";
import { ModeToggle } from "./ModeToggle";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  onSubmit: (file: File) => void;
  isStreaming: boolean;
  onStop: () => void;
  topK: number;
  onTopKChange: (n: number) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function ChatInput({
  mode,
  onModeChange,
  onSubmit,
  isStreaming,
  onStop,
  topK,
  onTopKChange,
}: ChatInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | undefined) => {
    if (!f || !ACCEPTED_TYPES.includes(f.type)) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = () => {
    if (!file || isStreaming) return;
    onSubmit(file);
    clearFile();
  };

  return (
    <div className="w-full max-w-2xl rounded-4xl border border-white/80 bg-white/85 p-3 shadow-float backdrop-blur-xl sm:p-4">
      {/* Preview or dropzone */}
      {file && previewUrl ? (
        <div className="mb-2.5 flex items-center gap-2.5 rounded-2xl bg-sky-50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Selected upload" className="h-10 w-10 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">{file.name}</p>
            <p className="text-xs text-ink-500">{(file.size / 1024).toFixed(0)} KB · ready to search</p>
          </div>
          <button
            onClick={clearFile}
            className="rounded-full p-1.5 text-ink-500 hover:bg-white hover:text-ink-900"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mb-2.5 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed py-4 text-center transition-colors sm:py-5",
            dragActive ? "border-sky-400 bg-sky-50" : "border-sky-200 hover:border-sky-300 hover:bg-sky-50/60"
          )}
        >
          <ImagePlus className="h-5 w-5 text-sky-500" />
          <p className="text-sm font-medium text-ink-700">Drop an image, or click to browse</p>
          <p className="text-xs text-ink-500">JPG, PNG, WEBP, HEIC — up to 10MB</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />

      {showAdvanced && (
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-sky-50 px-3 py-2">
          <span className="text-xs font-medium text-ink-600">Results to retrieve</span>
          <input
            type="range"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => onTopKChange(Number(e.target.value))}
            className="h-1 flex-1 accent-sky-500"
          />
          <span className="w-6 text-right font-mono text-xs text-ink-700">{topK}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-500 hover:bg-sky-50 hover:text-sky-600"
            aria-label="Attach image"
          >
            <ImagePlus className="h-4.5 w-4.5" />
          </button>
          <ModeToggle mode={mode} onChange={onModeChange} disabled={isStreaming} />
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              showAdvanced ? "bg-sky-100 text-sky-600" : "text-ink-500 hover:bg-sky-50 hover:text-sky-600"
            )}
            aria-label="Advanced options"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-white transition-colors hover:bg-ink-700"
            aria-label="Stop"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!file}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-soft transition-all hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-200"
            aria-label="Search"
          >
            <ArrowUp className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </div>
  );
}