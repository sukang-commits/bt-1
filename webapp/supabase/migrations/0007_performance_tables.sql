-- QSC 점수, 월간 달성률, 주간 수행도

create table qsc_scores (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id),
  year_month date not null,
  quality_score numeric(5, 2) not null check (quality_score between 0 and 100),
  service_score numeric(5, 2) not null check (service_score between 0 and 100),
  cleanliness_score numeric(5, 2) not null check (cleanliness_score between 0 and 100),
  qsc_total numeric(5, 2) generated always as (
    round((quality_score + service_score + cleanliness_score) / 3, 2)
  ) stored,
  item_scores jsonb not null default '{}'::jsonb,
  admin_comment text,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, year_month)
);

create table monthly_achievements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id),
  year_month date not null,
  weekly_performance_rate numeric(5, 2) not null,
  settlement_rate numeric(5, 2) not null,
  notice_ack_rate numeric(5, 2) not null,
  break_auth_rate numeric(5, 2) not null,
  task_completion_score numeric(5, 2) not null,
  achievement_rate numeric(5, 2) not null,
  previous_month_diff numeric(5, 2),
  total_score numeric(5, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, year_month)
);

create table weekly_performance (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id),
  profile_id uuid references profiles (id),
  week_start_date date not null,
  day_of_week smallint,
  required_tasks_total int not null default 0,
  required_tasks_completed int not null default 0,
  performance_rate numeric(5, 2) generated always as (
    case
      when required_tasks_total = 0 then 0
      else round(required_tasks_completed::numeric / required_tasks_total * 100, 2)
    end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_performance_day_check check (day_of_week is null or day_of_week between 0 and 6)
);

create index idx_qsc_scores_store_id on qsc_scores (store_id);
create index idx_monthly_achievements_store_id on monthly_achievements (store_id);
create index idx_weekly_performance_store_week on weekly_performance (store_id, week_start_date);
create index idx_weekly_performance_profile_id on weekly_performance (profile_id);
