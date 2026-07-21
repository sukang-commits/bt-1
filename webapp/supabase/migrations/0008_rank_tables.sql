-- 근무자 등급 (현재 상태 + 변경 이력)

create table employee_ranks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles (id) on delete cascade,
  grade employee_grade not null,
  is_honor_grade boolean not null default false,
  effective_from date not null default current_date,
  updated_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table rank_histories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  previous_grade employee_grade,
  new_grade employee_grade not null,
  change_type rank_change_type not null,
  reason text,
  changed_by uuid not null references profiles (id),
  effective_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_rank_histories_profile_id on rank_histories (profile_id);
create index idx_rank_histories_effective_date on rank_histories (effective_date);
