import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, AttachmentCategoryEnum } from "@/types/database";
import { todayKst } from "@/lib/date";

interface UploadAttachmentInput {
  supabase: SupabaseClient<Database>;
  file: File;
  category: AttachmentCategoryEnum;
  storeId: string;
  uploadedBy: string;
}

// 15단계(파일 업로드 및 사진 최적화)에서 브라우저 압축/WebP 변환이 이 함수 앞단에 추가될 예정입니다.
// 지금은 storage.objects RLS가 기대하는 stores/{storeId}/{category}/{yyyy}/{mm}/{uuid}.{ext}
// 경로 규칙만 지키는 단순 업로드입니다.
export async function uploadAttachment({
  supabase,
  file,
  category,
  storeId,
  uploadedBy,
}: UploadAttachmentInput) {
  const [year, month] = todayKst().split("-");
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `stores/${storeId}/${category}/${year}/${month}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: attachment, error: insertError } = await supabase
    .from("attachments")
    .insert({
      category,
      store_id: storeId,
      uploaded_by: uploadedBy,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
      width: null,
      height: null,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

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
