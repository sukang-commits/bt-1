-- 공지사항: 발행, 매장 범위, 확인 기록

create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  scope notice_scope not null default 'store',
  store_id uuid references stores (id) on delete cascade,
  is_important boolean not null default false,
  requires_ack boolean not null default false,
  publish_at timestamptz not null default now(),
  ack_due_at timestamptz,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint notices_store_scope_check check (
    (scope = 'store' and store_id is not null) or (scope <> 'store')
  )
);

-- scope = 'multi_store'인 공지가 적용되는 매장 목록
create table notice_stores (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices (id) on delete cascade,
  store_id uuid not null references stores (id) on delete cascade,
  unique (notice_id, store_id)
);

create table notice_attachments (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices (id) on delete cascade,
  attachment_id uuid not null references attachments (id) on delete cascade,
  unique (notice_id, attachment_id)
);

create table notice_reads (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references notices (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notice_id, profile_id)
);

create index idx_notices_store_id on notices (store_id);
create index idx_notices_scope on notices (scope);
create index idx_notices_publish_at on notices (publish_at);
create index idx_notices_deleted_at on notices (deleted_at);
create index idx_notice_stores_store_id on notice_stores (store_id);
create index idx_notice_reads_profile_id on notice_reads (profile_id);
create index idx_notice_reads_notice_id on notice_reads (notice_id);
