"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { uploadAttachment } from "@/lib/storage/upload";
import type { AttachmentCategoryEnum } from "@/types/database";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/utils";

interface PhotoAttachmentFieldProps {
  label?: string;
  category: AttachmentCategoryEnum;
  storeId: string;
  userId: string;
  value: string | null;
  onChange: (attachmentId: string | null) => void;
  required?: boolean;
}

export function PhotoAttachmentField({
  label = "사진 첨부",
  category,
  storeId,
  userId,
  value,
  onChange,
  required,
}: PhotoAttachmentFieldProps) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const attachmentId = await uploadAttachment({
        supabase,
        file,
        category,
        storeId,
        uploadedBy: userId,
      });
      onChange(attachmentId);
    } catch (error) {
      showToast("사진 업로드에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-border">
          <Image src={preview} alt="첨부 사진 미리보기" fill className="object-cover" unoptimized />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              aria-label="사진 제거"
              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted hover:bg-subtle"
          )}
        >
          <Camera className="h-7 w-7" />
          <span className="text-sm">사진 촬영/선택</span>
        </button>
      )}
      {value && !preview && <p className="mt-1 text-xs text-success">업로드 완료</p>}
    </div>
  );
}
