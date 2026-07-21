-- 공지/정산/휴게/체크리스트 인증 사진과 첨부파일을 저장할 Storage 버킷
-- 저장 경로 규칙: stores/{storeId}/{category}/{yyyy}/{mm}/{uuid}.{ext}
-- (attachments 테이블의 storage_path와 1:1로 대응합니다)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

-- 경로 규칙: stores/{storeId 또는 "global"}/{category}/{yyyy}/{mm}/{uuid}.{ext}
-- storeId 자리가 UUID가 아닌 경우(전체/복수 매장 공지 등 매장에 속하지 않는 첨부)는
-- is_member_of_store 캐스팅을 시도하지 않고 관리자/업로더 권한만으로 판단합니다.
create function storage_path_store_id(path_name text) returns uuid as $$
  select case
    when (storage.foldername(path_name))[2] ~ '^[0-9a-fA-F-]{36}$'
      then ((storage.foldername(path_name))[2])::uuid
    else null
  end;
$$ language sql immutable;

create policy storage_attachments_select on storage.objects for select
  using (
    bucket_id = 'attachments'
    and (
      is_admin()
      or owner = auth.uid()
      or is_member_of_store(storage_path_store_id(name))
    )
  );

create policy storage_attachments_insert on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and owner = auth.uid()
    and (is_admin() or is_member_of_store(storage_path_store_id(name)))
  );

create policy storage_attachments_delete on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and (owner = auth.uid() or is_admin())
  );
