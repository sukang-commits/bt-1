-- 정산 인증과 휴게시간 인증

create table settlements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id),
  profile_id uuid not null references profiles (id),
  work_date date not null,
  work_shift work_shift not null,
  pos_amount numeric(12, 2) not null,
  cash_amount numeric(12, 2) not null,
  card_confirmed boolean not null default false,
  variance numeric(12, 2) generated always as (cash_amount - pos_amount) stored,
  note text,
  photo_attachment_id uuid references attachments (id),
  status settlement_status not null default 'draft',
  submitted_at timestamptz,
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  revision_reason text,
  extra_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settlements_variance_requires_note check (
    variance = 0 or (note is not null and length(trim(note)) > 0)
  )
);

create table breaks (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id),
  profile_id uuid not null references profiles (id),
  work_date date not null default current_date,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes numeric(6, 1) generated always as (
    case
      when ended_at is not null
        then round((extract(epoch from (ended_at - started_at)) / 60)::numeric, 1)
      else null
    end
  ) stored,
  status break_status not null default 'in_progress',
  photo_attachment_id uuid references attachments (id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint breaks_end_after_start check (ended_at is null or ended_at >= started_at)
);

-- 근무자당 동시에 진행 중(종료되지 않은)인 휴게는 하나만 허용 -> 중복 시작/중복 종료 방지
create unique index idx_breaks_one_active_per_profile
  on breaks (profile_id)
  where ended_at is null;

create index idx_settlements_store_date on settlements (store_id, work_date);
create index idx_settlements_profile_id on settlements (profile_id);
create index idx_settlements_status on settlements (status);
create index idx_breaks_store_date on breaks (store_id, work_date);
create index idx_breaks_profile_id on breaks (profile_id);
create index idx_breaks_status on breaks (status);
