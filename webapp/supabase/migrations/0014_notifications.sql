-- 앱 내 알림
-- 2단계에서 정의한 20개 테이블에는 포함되지 않았지만, 14단계(알림과 기록 관리)가
-- 요구하는 "읽음/안읽음 구분, 알림 목록, 전체 읽음 처리, 배지" 기능은 사용자별
-- 읽음 상태를 어딘가에 영속시켜야만 구현할 수 있어 이 테이블을 추가합니다.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link_path text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_profile_id on notifications (profile_id, created_at desc);
create index idx_notifications_unread on notifications (profile_id) where read_at is null;

alter table notifications enable row level security;

create policy notifications_select on notifications for select
  using (profile_id = auth.uid());

-- audit_logs와 동일한 이유로, 일반 insert 정책은 열어두지 않습니다.
-- (다른 사용자에게 임의의 알림을 위조해 보낼 수 있는 경로를 차단하기 위함)
-- 알림 생성은 반드시 아래 create_notification() SECURITY DEFINER 함수를 통해서만 이뤄집니다.

create policy notifications_update on notifications for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create function create_notification(
  p_profile_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_link_path text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into notifications (profile_id, type, title, body, link_path)
  values (p_profile_id, p_type, p_title, p_body, p_link_path)
  returning id into v_id;

  return v_id;
end;
$$;
