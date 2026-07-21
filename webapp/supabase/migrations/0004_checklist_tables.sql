-- 체크리스트 템플릿과 제출 기록

create table checklists (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores (id) on delete cascade,
  brand_type brand_type not null,
  type checklist_type not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists (id) on delete cascade,
  label text not null,
  description text,
  is_required boolean not null default true,
  requires_photo boolean not null default true,
  is_core boolean not null default false,
  work_shift work_shift,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table checklist_submissions (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists (id),
  store_id uuid not null references stores (id),
  profile_id uuid not null references profiles (id),
  work_date date not null default current_date,
  status checklist_submission_status not null default 'submitted',
  progress_rate numeric(5, 2) not null default 0,
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  review_note text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table checklist_item_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references checklist_submissions (id) on delete cascade,
  checklist_item_id uuid not null references checklist_items (id),
  is_checked boolean not null default false,
  photo_attachment_id uuid references attachments (id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, checklist_item_id)
);

create index idx_checklists_store_id on checklists (store_id);
create index idx_checklists_type on checklists (type);
create index idx_checklist_items_checklist_id on checklist_items (checklist_id);
create index idx_checklist_submissions_store_date on checklist_submissions (store_id, work_date);
create index idx_checklist_submissions_profile_id on checklist_submissions (profile_id);
create index idx_checklist_submissions_status on checklist_submissions (status);
create index idx_checklist_item_submissions_submission_id on checklist_item_submissions (submission_id);
