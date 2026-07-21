import { ShiftCoverForm } from "@/components/shift-cover/ShiftCoverForm";

export default async function NewShiftCoverPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-ink">대타 요청 등록</h1>
      <ShiftCoverForm storeId={storeId} />
    </div>
  );
}
