-- 핵심 테이블: 첨부파일, 프로필, 매장, 매장-소속 매핑
-- attachments는 여러 테이블에서 참조하므로 가장 먼저 생성합니다.

create table attachments (
  id uuid primary key default gen_random_uuid(),
  category attachment_category not null,
  store_id uuid,
  uploaded_by uuid not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes int not null check (size_bytes > 0),
  width int,
  height int,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  role user_role not null default 'worker',
  brand_type brand_type not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table stores (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  brand_type brand_type not null,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, profile_id)
);

alter table attachments
  add constraint attachments_store_id_fkey foreign key (store_id) references stores (id) on delete cascade,
  add constraint attachments_uploaded_by_fkey foreign key (uploaded_by) references profiles (id);

create index idx_profiles_role on profiles (role);
create index idx_profiles_brand_type on profiles (brand_type);
create index idx_stores_active on stores (active);
create index idx_store_members_profile_id on store_members (profile_id);
create index idx_store_members_store_id on store_members (store_id);
create index idx_attachments_store_id on attachments (store_id);
create index idx_attachments_category on attachments (category);
create index idx_attachments_uploaded_by on attachments (uploaded_by);
