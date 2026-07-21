import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, AttachmentCategoryEnum } from "@/types/database";
import { todayKst } from "@/lib/date";
import { assertUploadable, compressImageToWebp } from "@/lib/storage/compress";

interface UploadAttachmentInput {
  supabase: SupabaseClient<Database>;
  file: File;
  category: AttachmentCategoryEnum;
  storeId: string;
  uploadedBy: string;
  onProgress?: (stage: "compressing" | "uploading" | "done") => void;
  maxRetries?: number;
}

// stores/{storeId}/{category}/{yyyy}/{mm}/{uuid}.{ext} 경로 규칙(storage RLS가 이 형태를 전제로
// 매장 소속을 검사합니다)을 지키면서, 압축 → 업로드 → DB 기록까지 한 번에 처리합니다.
// 파일명은 매번 새 uuid를 쓰므로 중복 걱정이 없고, 업로드 실패 시 지수 백오프로 재시도합니다.
export async function uploadAttachment({
  supabase,
  file,
  category,
  storeId,
  uploadedBy,
  onProgress,
  maxRetries = 2,
}: UploadAttachmentInput) {
  assertUploadable(file);

  onProgress?.("compressing");
  const compressed = await compressImageToWebp(file);

  const [year, month] = todayKst().split("-");
  const ext = compressed.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `stores/${storeId}/${category}/${year}/${month}/${crypto.randomUUID()}.${ext}`;

  onProgress?.("uploading");

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { error: uploadError } = await supabase.storage.from("attachments").upload(path, compressed, {
      contentType: compressed.type,
      upsert: false,
    });

    if (!uploadError) {
      lastError = null;
      break;
    }

    lastError = uploadError;
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
    }
  }
  if (lastError) throw lastError;

  const { data: attachment, error: insertError } = await supabase
    .from("attachments")
    .insert({
      category,
      store_id: storeId,
      uploaded_by: uploadedBy,
      storage_path: path,
      mime_type: compressed.type,
      size_bytes: compressed.size,
      width: null,
      height: null,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  onProgress?.("done");
  return attachment.id;
}

export async function getAttachmentSignedUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string,
  expiresInSeconds = 3600
) {
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
