-- 대타 요청과 수락

create table shift_cover_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id),
  requested_by uuid not null references profiles (id),
  work_date date not null,
  start_time time not null,
  end_time time not null,
  position text,
  reason text,
  is_urgent boolean not null default false,
  status shift_cover_status not null default 'recruiting',
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shift_cover_requests_time_check check (end_time > start_time)
);

create table shift_cover_acceptances (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references shift_cover_requests (id) on delete cascade,
  accepted_by uuid not null references profiles (id),
  is_cross_store boolean not null default false,
  status shift_cover_acceptance_status not null default 'pending',
  admin_approved_by uuid references profiles (id),
  admin_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, accepted_by)
);

create index idx_shift_cover_requests_store_id on shift_cover_requests (store_id);
create index idx_shift_cover_requests_status on shift_cover_requests (status);
create index idx_shift_cover_requests_work_date on shift_cover_requests (work_date);
create index idx_shift_cover_acceptances_request_id on shift_cover_acceptances (request_id);
create index idx_shift_cover_acceptances_accepted_by on shift_cover_acceptances (accepted_by);

-- 본인의 요청글은 본인이 수락할 수 없고, 이미 확정/취소/종료된 요청은 추가 수락을 받을 수 없습니다.
create function guard_shift_cover_acceptance() returns trigger as $$
declare
  v_requested_by uuid;
  v_status shift_cover_status;
begin
  select requested_by, status into v_requested_by, v_status
  from shift_cover_requests
  where id = new.request_id;

  if v_requested_by = new.accepted_by then
    raise exception '본인이 등록한 대타 요청은 본인이 수락할 수 없습니다.';
  end if;

  if v_status in ('approved', 'cancelled', 'closed') then
    raise exception '이미 종료되었거나 확정된 대타 요청에는 수락할 수 없습니다.';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_guard_shift_cover_acceptance
  before insert on shift_cover_acceptances
  for each row execute function guard_shift_cover_acceptance();
