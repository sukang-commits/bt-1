// 업로드 전 브라우저에서 이미지를 WebP로 변환하고 해상도/용량을 줄입니다.
// 업무 인증 사진은 세부 디테일보다 "무엇을 확인했는지"가 중요하므로,
// 최대 1600px / 품질 0.75 정도면 충분합니다.
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.75;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB (원본 기준, storage 버킷 제한과 동일)

export function assertUploadable(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("JPG, PNG, WebP 이미지만 업로드할 수 있습니다.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("파일 용량은 10MB를 넘을 수 없습니다.");
  }
}

export async function compressImageToWebp(file: File): Promise<File> {
  if (typeof createImageBitmap === "undefined") return file; // 구형 환경 fallback

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
  );
  if (!blob) return file;

  // 압축 결과가 원본보다 크면(이미 작은 파일 등) 원본을 그대로 사용합니다.
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], newName, { type: "image/webp" });
}
