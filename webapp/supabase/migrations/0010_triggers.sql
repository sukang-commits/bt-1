-- 공통 트리거: updated_at 자동 갱신, audit log 기록 함수

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles', 'stores', 'attachments',
      'notices', 'checklists', 'checklist_items',
      'checklist_submissions', 'checklist_item_submissions',
      'settlements', 'breaks',
      'shift_cover_requests', 'shift_cover_acceptances',
      'qsc_scores', 'monthly_achievements', 'weekly_performance',
      'employee_ranks'
    ])
  loop
    execute format(
      'create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();',
      t
    );
  end loop;
end;
$$;

-- 관리자 화면(공지/정산/대타/등급/QSC/체크리스트/계정)에서 등록·수정·승인 시
-- 서버 코드가 이 함수를 호출해 audit_logs에 기록합니다. RLS로 일반 insert 권한을 열어주는 대신
-- SECURITY DEFINER 함수를 통해서만 기록되도록 하여 감사 기록의 무결성을 보장합니다.
create function log_audit_event(
  p_actor_id uuid,
  p_action text,
  p_target_table text,
  p_target_id uuid,
  p_before_data jsonb default null,
  p_after_data jsonb default null,
  p_ip_address inet default null,
  p_user_agent text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into audit_logs (
    actor_id, action, target_table, target_id,
    before_data, after_data, ip_address, user_agent
  ) values (
    p_actor_id, p_action, p_target_table, p_target_id,
    p_before_data, p_after_data, p_ip_address, p_user_agent
  )
  returning id into v_id;

  return v_id;
end;
$$;
