-- 감사 기록 (audit log)
-- 클라이언트가 직접 insert 하지 않고, SECURITY DEFINER 함수(log_audit_event)를 통해서만
-- 기록됩니다 (0010_triggers.sql 참고). RLS에서도 일반 사용자의 insert 권한은 부여하지 않습니다.

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id),
  action text not null,
  target_table text not null,
  target_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_target on audit_logs (target_table, target_id);
create index idx_audit_logs_actor_id on audit_logs (actor_id);
create index idx_audit_logs_created_at on audit_logs (created_at);
