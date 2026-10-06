"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  resolveImageType,
  toUploadErrorMessage,
  uploadImage,
  uploadImages,
  type ImageType,
  type UploadedImage,
} from "@/lib/api/dashboard/upload";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_MAX_FILES = 5;

type PreviewItem = {
  id: string;
  url: string;
  uploading: boolean;
};

type BaseProps = {
  folder: string;
  disabled?: boolean;
  className?: string;
};

type UploadedAsset = {
  url: string;
  publicId: string;
  variants: string[];
};

type SingleProps = BaseProps & {
  mode: "single";
  value?: string | null;
  onChange?: (url: string) => void;
  onUploaded?: (asset: UploadedAsset) => void;
  variantIndex?: number;
  maxFiles?: never;
  primaryUrl?: never;
  onPrimaryChange?: never;
};

type MultipleProps = BaseProps & {
  mode: "multiple";
  value?: string[];
  onChange?: (urls: string[]) => void;
  maxFiles?: number;
  primaryUrl?: string;
  onPrimaryChange?: (url: string) => void;
  variantIndex?: never;
};

export type ImageUploadProps = SingleProps | MultipleProps;

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(extOf(file.name))) {
    return "Invalid image type. Only jpg, jpeg, png, and webp are allowed";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image is too large. Maximum size is 5MB";
  }
  return null;
}

function asUrls(props: ImageUploadProps): string[] {
  if (props.mode === "single") {
    return props.value ? [props.value] : [];
  }
  return props.value ?? [];
}

function pickUrl(result: UploadedImage, variantIndex?: number): string {
  if (typeof variantIndex === "number" && result.variants?.[variantIndex]) {
    return result.variants[variantIndex];
  }
  return result.secure_url || result.url;
}

function emit(props: ImageUploadProps, urls: string[], assets?: UploadedAsset[]) {
  if (props.mode === "single") {
    props.onChange?.(urls[0] ?? "");
    if (assets?.[0]) props.onUploaded?.(assets[0]);
    else if (!urls[0]) {
      props.onUploaded?.({ url: "", publicId: "", variants: [] });
    }
    return;
  }
  props.onChange?.(urls);
}

async function uploadFiles(files: File[], type: ImageType): Promise<UploadedImage[]> {
  if (files.length > 1 && type === "product") {
    return uploadImages(files, "product");
  }
  const results: UploadedImage[] = [];
  for (const file of files) {
    results.push(await uploadImage(file, type));
  }
  return results;
}

export function ImageUpload(props: ImageUploadProps) {
  const { mode, folder, disabled, className } = props;
  const maxFiles = mode === "multiple" ? (props.maxFiles ?? DEFAULT_MAX_FILES) : 1;
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const committed = asUrls(props);
  const uploading = previews.some((p) => p.uploading);
  const visible = [...committed.map((url) => ({ id: url, url, uploading: false })), ...previews];
  const slotsLeft = Math.max(0, maxFiles - committed.length - previews.length);
  const canAdd = !disabled && !uploading && slotsLeft > 0;
  const type = resolveImageType(folder);

  const mutation = useMutation({
    mutationFn: (files: File[]) => uploadFiles(files, type),
  });

  const handleFiles = useCallback(
    (list: FileList | File[]) => {
      if (!canAdd) return;
      const incoming = Array.from(list);
      const accepted: File[] = [];

      for (const file of incoming) {
        const error = validateImageFile(file);
        if (error) {
          toast.error(error);
          continue;
        }
        if (accepted.length >= slotsLeft) {
          toast.error(`A maximum of ${maxFiles} images is allowed`);
          break;
        }
        accepted.push(file);
      }

      if (accepted.length === 0) return;

      const local: PreviewItem[] = accepted.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        url: URL.createObjectURL(file),
        uploading: true,
      }));
      setPreviews((prev) => [...prev, ...local]);

      mutation.mutate(accepted, {
        onSuccess: (results) => {
          const variantIndex = props.mode === "single" ? props.variantIndex : undefined;
          const assets = results.map((r) => ({
            url: pickUrl(r, variantIndex),
            publicId: r.publicId,
            variants: r.variants ?? [],
          }));
          const urls = assets.map((a) => a.url);
          local.forEach((item) => URL.revokeObjectURL(item.url));
          setPreviews((prev) => prev.filter((p) => !local.some((l) => l.id === p.id)));
          emit(props, [...committed, ...urls].slice(0, maxFiles), assets);
        },
        onError: (err) => {
          local.forEach((item) => URL.revokeObjectURL(item.url));
          setPreviews((prev) => prev.filter((p) => !local.some((l) => l.id === p.id)));
          toast.error(toUploadErrorMessage(err));
        },
      });
    },
    [canAdd, slotsLeft, maxFiles, mutation, props, committed]
  );

  const removeAt = (url: string, isPreview: boolean) => {
    if (disabled || uploading) return;
    if (isPreview) return;
    const next = committed.filter((u) => u !== url);
    emit(props, next);
    if (mode === "multiple" && props.onPrimaryChange && props.primaryUrl === url) {
      props.onPrimaryChange(next[0] ?? "");
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {canAdd ? (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50 hover:bg-accent/40"
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <span className="text-sm font-medium">
            Drop {mode === "single" ? "an image" : "images"} here or click to upload
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG, or WebP. Max 5MB
            {mode === "multiple" ? ` · up to ${maxFiles} files` : ""}
          </span>
          <input
            id={inputId}
            type="file"
            accept={ACCEPT}
            multiple={mode === "multiple"}
            className="sr-only"
            disabled={!canAdd}
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      ) : null}

      {visible.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((item) => {
            const isPrimary =
              mode === "multiple" && !item.uploading && props.primaryUrl === item.url;
            return (
              <li
                key={item.id}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-lg border bg-muted/30",
                  isPrimary && "ring-2 ring-primary"
                )}
              >
                <Image
                  src={item.url}
                  alt=""
                  fill
                  className="object-cover w-auto h-auto"
                  loading="lazy"
                />
                {item.uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    className="absolute top-1.5 right-1.5 z-10"
                    disabled={disabled || uploading}
                    onClick={() => removeAt(item.url, item.uploading)}
                    aria-label="Remove image"
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
                {mode === "multiple" && props.onPrimaryChange && !item.uploading ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => props.onPrimaryChange?.(item.url)}
                    className={cn(
                      "absolute inset-x-0 bottom-0 z-10 bg-black/60 px-2 py-1 text-[11px] font-medium text-white",
                      isPrimary ? "bg-primary/90" : "hover:bg-black/75"
                    )}
                  >
                    {isPrimary ? "Primary" : "Set as primary"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
