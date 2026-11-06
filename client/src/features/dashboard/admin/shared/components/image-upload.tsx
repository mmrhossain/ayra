"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Images, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listMediaLibrary,
  resolveImageType,
  toUploadErrorMessage,
  uploadImage,
  uploadImages,
  type ImageType,
  type MediaLibraryItem,
  type UploadedImage,
} from "@/lib/api/dashboard/upload";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_MAX_FILES = 5;
const GALLERY_PAGE_SIZE = 24;
// The server caps in-flight uploads at 4 per user; stay just under it so a
// product's deferred images can upload in parallel without tripping the guard.
const MAX_PARALLEL_UPLOADS = 3;
const GALLERY_TYPES = new Set<ImageType>(["product", "category", "slider", "blog", "brand"]);

type PreviewItem = {
  id: string;
  url: string;
  uploading: boolean;
  pending?: boolean;
};

type BaseProps = {
  folder: string;
  disabled?: boolean;
  className?: string;
  /**
   * When true the component only previews locally selected files; the actual
   * upload is deferred until the parent calls `flush()` (typically on submit).
   * Already-uploaded assets (existing value, media library) still pass through
   * as URLs. Avoids orphan uploads when a form is cancelled.
   */
  deferUpload?: boolean;
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

export type ImageUploadHandle = {
  /** Uploads any deferred files, then reports their URLs via onChange/onUploaded. */
  flush: () => Promise<void>;
};

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

function toAsset(item: UploadedImage, variantIndex?: number): UploadedAsset {
  return {
    url: pickUrl(item, variantIndex),
    publicId: item.publicId,
    variants: item.variants ?? [],
  };
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const size = Math.max(1, Math.min(limit, queue.length));
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
        await worker(item);
      }
    }),
  );
}

export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(
  function ImageUpload(props, ref) {
    const { mode, folder, disabled, className, deferUpload = false } = props;
    const maxFiles = mode === "multiple" ? (props.maxFiles ?? DEFAULT_MAX_FILES) : 1;
    const inputId = useId();
    const type = resolveImageType(folder);
    const useGallery = GALLERY_TYPES.has(type);
    const [dragOver, setDragOver] = useState(false);
    const [previews, setPreviews] = useState<PreviewItem[]>([]);
    const [libraryOpen, setLibraryOpen] = useState(false);
    const pendingFiles = useRef<Array<{ file: File; previewId: string; url: string }>>([]);
    const committed = asUrls(props);
    const uploading = previews.some((p) => p.uploading);
    const visible = [
      ...committed.map((url) => ({ id: url, url, uploading: false, pending: false })),
      ...previews,
    ];
    const slotsLeft = Math.max(0, maxFiles - committed.length - previews.length);
    const canAdd = !disabled && !uploading && slotsLeft > 0;

    const mutation = useMutation({
      mutationFn: (files: File[]) => uploadFiles(files, type),
    });

    // Revokes any deferred object URLs and drops their previews. Used on
    // unmount, on replace (single mode), and when picking an already-uploaded
    // library asset so a raw File value and an existing URL never coexist.
    const clearPending = useCallback(() => {
      const pending = pendingFiles.current;
      if (pending.length === 0) return;
      const ids = new Set(pending.map((item) => item.previewId));
      pending.forEach((item) => URL.revokeObjectURL(item.url));
      pendingFiles.current = [];
      setPreviews((prev) => prev.filter((p) => !ids.has(p.id)));
    }, []);

    useEffect(() => {
      return () => {
        pendingFiles.current.forEach((item) => URL.revokeObjectURL(item.url));
        pendingFiles.current = [];
      };
    }, []);

    const applyResults = useCallback(
      (results: UploadedImage[]) => {
        const variantIndex = props.mode === "single" ? props.variantIndex : undefined;
        if (props.mode === "single") {
          const result = results[0];
          if (!result) return;
          const asset = toAsset(result, variantIndex);
          emit(props, [asset.url], [asset]);
          return;
        }
        const assets: UploadedAsset[] = [];
        const urls = [...committed];
        for (const result of results) {
          const asset = toAsset(result, variantIndex);
          if (urls.includes(asset.url)) continue;
          if (urls.length >= maxFiles) break;
          urls.push(asset.url);
          assets.push(asset);
        }
        emit(props, urls, assets);
      },
      [committed, maxFiles, props]
    );

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

        // In single mode a fresh selection replaces the current deferred file.
        if (deferUpload && mode === "single") clearPending();

        const local: PreviewItem[] = accepted.map((file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          url: URL.createObjectURL(file),
          uploading: !deferUpload,
        }));

        if (deferUpload) {
          pendingFiles.current = [
            ...pendingFiles.current,
            ...accepted.map((file, index) => ({
              file,
              previewId: local[index]!.id,
              url: local[index]!.url,
            })),
          ];
          setPreviews((prev) => [...prev, ...local.map((item) => ({ ...item, pending: true }))]);
          return;
        }

        setPreviews((prev) => [...prev, ...local]);

        mutation.mutate(accepted, {
          onSuccess: (results) => {
            local.forEach((item) => URL.revokeObjectURL(item.url));
            setPreviews((prev) => prev.filter((p) => !local.some((l) => l.id === p.id)));
            applyResults(results);
          },
          onError: (err) => {
            local.forEach((item) => URL.revokeObjectURL(item.url));
            setPreviews((prev) => prev.filter((p) => !local.some((l) => l.id === p.id)));
            toast.error(toUploadErrorMessage(err));
          },
        });
      },
      [applyResults, canAdd, clearPending, deferUpload, maxFiles, mode, mutation, slotsLeft]
    );

    const flush = useCallback(async () => {
      const pending = [...pendingFiles.current];
      if (pending.length === 0) return;
      const ids = new Set(pending.map((item) => item.previewId));

      setPreviews((prev) =>
        prev.map((item) => (ids.has(item.id) ? { ...item, uploading: true } : item))
      );

      // Upload the deferred files in parallel (bounded) but keep their previews
      // visible the whole time. A finished image is only swapped into its
      // committed slot once the batch settles, so it never flashes out of the
      // grid between "uploading" and "saved". Results are stored by index so the
      // on-screen order matches the order the files were picked.
      const results: Array<UploadedImage | null> = new Array(pending.length).fill(null);
      const succeededIds = new Set<string>();
      const failedIds = new Set<string>();
      let firstError: string | null = null;

      await runWithConcurrency(
        pending.map((item, index) => ({ item, index })),
        MAX_PARALLEL_UPLOADS,
        async ({ item, index }) => {
          try {
            const [result] = await uploadFiles([item.file], type);
            if (result) results[index] = result;
            URL.revokeObjectURL(item.url);
            succeededIds.add(item.previewId);
            pendingFiles.current = pendingFiles.current.filter(
              (p) => p.previewId !== item.previewId
            );
          } catch (err) {
            firstError ??= toUploadErrorMessage(err);
            failedIds.add(item.previewId);
          }
        }
      );

      const succeeded = results.filter(
        (result): result is UploadedImage => result !== null
      );
      if (succeeded.length > 0) applyResults(succeeded);

      setPreviews((prev) =>
        prev
          .filter((item) => !succeededIds.has(item.id))
          .map((item) =>
            failedIds.has(item.id) ? { ...item, uploading: false } : item
          )
      );

      if (firstError) {
        toast.error(firstError);
        throw new Error(firstError);
      }
    }, [applyResults, type]);

    useImperativeHandle(ref, () => ({ flush }), [flush]);

    const removeItem = (item: {
      id: string;
      url: string;
      uploading: boolean;
      pending?: boolean;
    }) => {
      if (disabled || item.uploading) return;
      if (item.pending) {
        const target = pendingFiles.current.find((p) => p.previewId === item.id);
        if (target) URL.revokeObjectURL(target.url);
        pendingFiles.current = pendingFiles.current.filter((p) => p.previewId !== item.id);
        setPreviews((prev) => prev.filter((p) => p.id !== item.id));
        return;
      }
      const next = committed.filter((u) => u !== item.url);
      emit(props, next);
      if (mode === "multiple" && props.onPrimaryChange && props.primaryUrl === item.url) {
        props.onPrimaryChange(next[0] ?? "");
      }
    };

    const dropzone = (
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
          JPG, PNG, or WebP. Max 5MB[cite: 1]
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
    );

    return (
      <div className={cn("space-y-3", className)}>
        {canAdd && useGallery ? (
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-2"
            disabled={disabled || uploading}
            onClick={() => setLibraryOpen(true)}
          >
            <Images className="size-4" />
            Choose image
          </Button>
        ) : null}
        {canAdd && !useGallery ? dropzone : null}

        {visible.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((item) => {
              const isPrimary =
                mode === "multiple" &&
                !item.uploading &&
                !item.pending &&
                props.primaryUrl === item.url;
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
                    fill={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
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
                      disabled={disabled}
                      onClick={() => removeItem(item)}
                      aria-label="Remove image"
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                  {item.pending ? (
                    <span className="absolute inset-x-0 bottom-0 z-10 bg-amber-500/90 px-2 py-1 text-center text-xs font-medium text-white">
                      Uploads on save
                    </span>
                  ) : null}
                  {mode === "multiple" &&
                  props.onPrimaryChange &&
                  !item.uploading &&
                  !item.pending ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => props.onPrimaryChange?.(item.url)}
                      className={cn(
                        "absolute inset-x-0 bottom-0 z-10 bg-black/60 px-2 py-1 text-xs font-medium text-white",
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

        {useGallery ? (
          <MediaLibraryDialog
            open={libraryOpen}
            onOpenChange={setLibraryOpen}
            type={type}
            mode={mode}
            slotsLeft={slotsLeft}
            maxFiles={maxFiles}
            uploading={uploading}
            onSelect={(items) => {
              if (mode === "single") clearPending();
              applyResults(items);
              setLibraryOpen(false);
            }}
            onUpload={handleFiles}
          />
        ) : null}
      </div>
    );
  }
);

function MediaLibraryDialog({
  open,
  onOpenChange,
  type,
  mode,
  slotsLeft,
  maxFiles,
  uploading,
  onSelect,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ImageType;
  mode: "single" | "multiple";
  slotsLeft: number;
  maxFiles: number;
  uploading: boolean;
  onSelect: (items: UploadedImage[]) => void;
  onUpload: (files: FileList | File[]) => void;
}) {
  const queryClient = useQueryClient();
  const inputId = useId();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, MediaLibraryItem>>({});
  const [dragOver, setDragOver] = useState(false);
  const selectedList = Object.values(selected);
  const canConfirm = selectedList.length > 0 && selectedList.length <= slotsLeft;

  const query = useQuery({
    queryKey: ["media-library", type, page],
    queryFn: () => listMediaLibrary(type, page, GALLERY_PAGE_SIZE),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const items = query.data?.items ?? [];
  const pagination = query.data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;

  const toggle = (item: MediaLibraryItem) => {
    setSelected((prev) => {
      if (prev[item.publicId]) {
        const next = { ...prev };
        delete next[item.publicId];
        return next;
      }
      if (mode === "single") {
        return { [item.publicId]: item };
      }
      if (Object.keys(prev).length >= slotsLeft) {
        toast.error(`A maximum of ${maxFiles} images is allowed`);
        return prev;
      }
      return { ...prev, [item.publicId]: item };
    });
  };

  const handleDeviceFiles = (files: FileList | File[]) => {
    onUpload(files);
    void queryClient.invalidateQueries({ queryKey: ["media-library", type] });
    onOpenChange(false);
    setSelected({});
    setPage(1);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setSelected({});
          setPage(1);
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media library</DialogTitle>
          <DialogDescription>
            Pick a Cloudinary image of this type, or upload from your device.
          </DialogDescription>
        </DialogHeader>

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
            if (!uploading) handleDeviceFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors",
            uploading && "pointer-events-none opacity-60",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50 hover:bg-accent/40"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Uploading image...</span>
            </>
          ) : (
            <>
              <Upload className="size-4 text-muted-foreground" />
              <span>Upload from device</span>
            </>
          )}
          <input
            id={inputId}
            type="file"
            accept={ACCEPT}
            multiple={mode === "multiple"}
            className="sr-only"
            disabled={uploading || slotsLeft <= 0}
            onChange={(e) => {
              if (e.target.files) handleDeviceFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        <div className="relative min-h-[12rem]">
          {uploading ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Uploading files to library...
              </p>
            </div>
          ) : null}

          {query.isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No images in this library yet. Upload from your device.
            </p>
          ) : (
            <ul className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
              {items.map((item) => {
                const isSelected = Boolean(selected[item.publicId]);
                return (
                  <li key={item.publicId}>
                    <button
                      type="button"
                      onClick={() => toggle(item)}
                      className={cn(
                        "relative aspect-square w-full overflow-hidden rounded-lg border bg-muted/30",
                        isSelected && "ring-2 ring-primary"
                      )}
                      aria-pressed={isSelected}
                      aria-label="Select library image"
                    >
                      <Image
                        src={item.secure_url || item.url}
                        alt=""
                        fill={true}
                        sizes="(max-width: 640px) 33vw, 200px"
                        loading="lazy"
                        className="object-cover"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canConfirm || uploading}
            onClick={() => {
              onSelect(selectedList);
              setSelected({});
            }}
          >
            Use selected{selectedList.length ? ` (${selectedList.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
