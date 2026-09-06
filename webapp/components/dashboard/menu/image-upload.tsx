"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Trash, UploadSimple, PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { getImagePreviewUrl } from "@/lib/convex/client";
import { toast } from "sonner";
import { MAX_IMAGE_SIZE_BYTES, isAllowedImageFile } from "@/lib/constants";

interface ImageUploadProps {
  existingImageId?: string;
  onFileSelect: (file: File | null) => void;
  onRemoveExisting?: () => void;
  className?: string;
}

export function ImageUpload({
  existingImageId,
  onFileSelect,
  onRemoveExisting,
  className,
}: ImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [prevImageId, setPrevImageId] = useState(existingImageId);

  // Reset isRemoved if the incoming existingImageId prop changes (e.g. editing a different item)
  if (existingImageId !== prevImageId) {
    setPrevImageId(existingImageId);
    setIsRemoved(false);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }

  const showExisting = !!existingImageId && !isRemoved;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = useCallback(
    (file: File | null) => {
      if (preview) URL.revokeObjectURL(preview);
      if (file) {
        if (!isAllowedImageFile(file)) {
          toast.error(t("invalidImageFormat"));
          if (inputRef.current) inputRef.current.value = "";
          return;
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          toast.error(t("imageTooLarge"));
          if (inputRef.current) inputRef.current.value = "";
          return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        setIsRemoved(false);
        onFileSelect(file);
      } else {
        setPreview(null);
        onFileSelect(null);
      }
    },
    [onFileSelect, preview, t],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setIsRemoved(true);
    onFileSelect(null);
    onRemoveExisting?.();
    if (inputRef.current) inputRef.current.value = "";
  };

  const existingUrl = existingImageId
    ? getImagePreviewUrl(existingImageId)
    : null;

  const hasImage = preview || (showExisting && existingUrl);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div
        className={cn(
          "relative rounded-xl border border-dashed transition-colors cursor-pointer overflow-hidden flex-1 flex flex-col",
          isDragging
            ? "border-primary-foreground bg-primary-foreground/10"
            : hasImage
              ? "border-transparent"
              : "border-primary-foreground/20 hover:border-primary-foreground/40 bg-black",
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role={hasImage ? undefined : "button"}
        tabIndex={hasImage ? undefined : 0}
        onKeyDown={(e) => {
          if (!hasImage && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {hasImage ? (
          <div className="relative w-full h-full min-h-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview || existingUrl!}
              alt=""
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
              <span className="text-white font-medium text-xs bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <PencilSimple className="w-3.5 h-3.5" />
                {t("changeImage")}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-destructive hover:text-white text-white transition-colors shadow-sm"
                title={t("removeImage")}
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 p-6 text-center text-primary-foreground/70 min-h-[200px]">
            <UploadSimple
              className="w-10 h-10 text-primary-foreground/70 transition-colors"
              weight={isDragging ? "bold" : "regular"}
            />
            <p className="text-sm font-medium text-primary-foreground">
              {t("dragOrClick")}
            </p>
            <p className="text-xs text-primary-foreground/60">
              {t("maxFileSize")}
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
