"use client";

import { forwardRef, useCallback, useImperativeHandle } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  /** When true, renders only a hidden file input (no visible drop target). */
  hidden?: boolean;
}

export interface DropzoneHandle {
  openPicker: () => void;
}

const MAX_BYTES = 10 * 1024 * 1024;

export const Dropzone = forwardRef<DropzoneHandle, DropzoneProps>(
  function Dropzone({ onFile, disabled, hidden }, ref) {
    const onDrop = useCallback(
      (files: File[]) => {
        const file = files[0];
        if (!file) return;
        if (file.size > MAX_BYTES) {
          alert("File size must be 10MB or less.");
          return;
        }
        onFile(file);
      },
      [onFile],
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
      onDrop,
      multiple: false,
      noClick: hidden,
      noKeyboard: hidden,
      noDrag: hidden,
      accept: {
        "image/png": [".png"],
        "image/jpeg": [".jpg", ".jpeg"],
      },
      disabled,
    });

    useImperativeHandle(
      ref,
      () => ({
        openPicker: () => {
          if (disabled) return;
          // react-dropzone's open() opens the native file picker.
          open();
        },
      }),
      [disabled, open],
    );

    if (hidden) {
      // Hidden mode: render only the native input so `open()` has somewhere
      // to point. The input itself is not visible.
      return (
        <div className="hidden" aria-hidden>
          <input {...getInputProps()} />
        </div>
      );
    }

    return (
      <div
        {...getRootProps()}
        className={cn(
          "flex h-24 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-2 text-sm transition",
          "border-zinc-700 bg-zinc-900/40 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-900/60",
          isDragActive && "border-sky-500 bg-sky-500/10 text-sky-200",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <div className="text-sm font-medium text-zinc-200">Upload</div>
        <div className="mt-0.5 text-[10px] text-zinc-500">
          PNG · JPG · max 10MB
        </div>
      </div>
    );
  },
);
