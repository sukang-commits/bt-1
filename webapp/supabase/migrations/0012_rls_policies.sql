-- Row Level Security 정책
-- 공통 원칙:
--   worker           : 본인 데이터 + 소속 매장의 공개 데이터만 조회, 본인 데이터 작성
--   store_manager    : 본인 매장(store_members로 배정된 매장)의 운영 데이터 관리
--   senior_manager / deputy_manager / administrator : 전 매장 데이터 조회/관리 (`/admin` 접근)
--   administrator만 계정/권한(profiles insert 등)을 직접 다룸

-- ============ profiles ============
alter table profiles enable row level security;

create policy profiles_select on profiles for select
  using (
    id = auth.uid()
    or is_admin()
    or exists (
      select 1 from store_members sm1
      join store_members sm2 on sm1.store_id = sm2.store_id
      where sm1.profile_id = auth.uid() and sm2.profile_id = profiles.id
    )
  );

create policy profiles_insert on profiles for insert
  with check (is_admin());

create policy profiles_update on profiles for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- 본인이 스스로 role/brand_type/active(권한 관련 필드)를 바꿔 승격하는 것을 방지
create function guard_profile_self_update() returns trigger as $$
begin
  if not is_admin() then
    if new.role is distinct from old.role
      or new.brand_type is distinct from old.brand_type
      or new.active is distinct from old.active then
      raise exception '본인 권한/상태 정보는 관리자만 변경할 수 있습니다.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_guard_profile_self_update
  before update on profiles
  for each row execute function guard_profile_self_update();

-- ============ stores ============
alter table stores enable row level security;

create policy stores_select on stores for select
  using (is_admin() or is_member_of_store(id));

create policy stores_insert on stores for insert
  with check (is_admin());

create policy stores_update on stores for update
  using (is_admin())
  with check (is_admin());

-- ============ store_members ============
alter table store_members enable row level security;

create policy store_members_select on store_members for select
  using (is_admin() or profile_id = auth.uid() or is_member_of_store(store_id));

create policy store_members_insert on store_members for insert
  with check (is_admin());

create policy store_members_update on store_members for update
  using (is_admin())
  with check (is_admin());

create policy store_members_delete on store_members for delete
  using (is_admin());

-- ============ notices / notice_stores / notice_attachments / notice_reads ============
alter table notices enable row level security;
alter table notice_stores enable row level security;
alter table notice_attachments enable row level security;
alter table notice_reads enable row level security;

create policy notices_select on notices for select
  using (
    is_admin()
    or (
      deleted_at is null
      and (
        scope = 'all_stores'
        or (scope = 'store' and is_member_of_store(store_id))
        or (scope = 'multi_store' and exists (
          select 1 from notice_stores ns
          where ns.notice_id = notices.id and is_member_of_store(ns.store_id)
        ))
      )
    )
  );

create policy notices_insert on notices for insert
  with check (
    is_admin()
    or (is_store_manager() and scope = 'store' and is_manager_of_store(store_id))
  );

create policy notices_update on notices for update
  using (
    is_admin()
    or (is_store_manager() and scope = 'store' and is_manager_of_store(store_id))
  )
  with check (
    is_admin()
    or (is_store_manager() and scope = 'store' and is_manager_of_store(store_id))
  );

create policy notice_stores_select on notice_stores for select
  using (is_admin() or is_member_of_store(store_id));

create policy notice_stores_write on notice_stores for insert
  with check (is_admin());

create policy notice_stores_delete on notice_stores for delete
  using (is_admin());

create policy notice_attachments_select on notice_attachments for select
  using (
    exists (
      select 1 from notices n where n.id = notice_attachments.notice_id
    )
  );

create policy notice_attachments_insert on notice_attachments for insert
  with check (
    exists (
      select 1 from notices n
      where n.id = notice_attachments.notice_id
        and (is_admin() or (is_store_manager() and is_manager_of_store(n.store_id)))
    )
  );

create policy notice_reads_select on notice_reads for select
  using (
    profile_id = auth.uid()
    or is_admin()
    or exists (
      select 1 from notices n where n.id = notice_reads.notice_id and is_manager_of_store(n.store_id)
    )
  );

create policy notice_reads_insert on notice_reads for insert
  with check (profile_id = auth.uid());

-- ============ checklists / checklist_items ============
alter table checklists enable row level security;
alter table checklist_items enable row level security;

create policy checklists_select on checklists for select
  using (
    is_admin()
    or (store_id is not null and is_member_of_store(store_id))
    or (
      store_id is null
      and exists (
        select 1 from store_members sm
        join stores s on s.id = sm.store_id
        where sm.profile_id = auth.uid() and s.brand_type = checklists.brand_type
      )
    )
  );

create policy checklists_write on checklists for insert with check (is_admin());
create policy checklists_update on checklists for update using (is_admin()) with check (is_admin());

create policy checklist_items_select on checklist_items for select
  using (
    exists (
      select 1 from checklists c where c.id = checklist_items.checklist_id
    )
  );

create policy checklist_items_write on checklist_items for insert with check (is_admin());
create policy checklist_items_update on checklist_items for update using (is_admin()) with check (is_admin());

-- ============ checklist_submissions / checklist_item_submissions ============
alter table checklist_submissions enable row level security;
alter table checklist_item_submissions enable row level security;

create policy checklist_submissions_select on checklist_submissions for select
  using (profile_id = auth.uid() or is_admin() or is_manager_of_store(store_id));

create policy checklist_submissions_insert on checklist_submissions for insert
  with check (profile_id = auth.uid() and is_member_of_store(store_id));

create policy checklist_submissions_update on checklist_submissions for update
  using (profile_id = auth.uid() or is_admin() or is_manager_of_store(store_id))
  with check (profile_id = auth.uid() or is_admin() or is_manager_of_store(store_id));

create policy checklist_item_submissions_select on checklist_item_submissions for select
  using (
    exists (
      select 1 from checklist_submissions s
      where s.id = checklist_item_submissions.submission_id
        and (s.profile_id = auth.uid() or is_admin() or is_manager_of_store(s.store_id))
    )
  );

create policy checklist_item_submissions_insert on checklist_item_submissions for insert
  with check (
    exists (
      select 1 from checklist_submissions s
      where s.id = checklist_item_submissions.submission_id and s.profile_id = auth.uid()
    )
  );

create policy checklist_item_submissions_update on checklist_item_submissions for update
  using (
    exists (
      select 1 from checklist_submissions s
      where s.id = checklist_item_submissions.submission_id
        and (s.profile_id = auth.uid() or is_admin() or is_manager_of_store(s.store_id))
    )
  );

-- ============ settlements ============
alter table settlements enable row level security;

create policy settlements_select on settlements for select
  using (profile_id = auth.uid() or is_admin() or is_manager_of_store(store_id));

create policy settlements_insert on settlements for insert
  with check (profile_id = auth.uid() and is_member_of_store(store_id));

create policy settlements_update on settlements for update
  using (
    (profile_id = auth.uid() and status in ('draft', 'revision_requested'))
    or is_admin()
    or is_manager_of_store(store_id)
  )
  with check (
    (profile_id = auth.uid() and status in ('draft', 'submitted', 'revision_requested'))
    or is_admin()
    or is_manager_of_store(store_id)
  );

-- ============ breaks ============
alter table breaks enable row level security;

create policy breaks_select on breaks for select
  using (profile_id = auth.uid() or is_admin() or is_manager_of_store(store_id));

create policy breaks_insert on breaks for insert
  with check (profile_id = auth.uid() and is_member_of_store(store_id));

create policy breaks_update on breaks for update
  using (profile_id = auth.uid() or is_admin() or is_manager_of_store(store_id))
  with check (profile_id = auth.uid() or is_admin() or is_manager_of_store(store_id));

-- ============ shift_cover_requests / shift_cover_acceptances ============
alter table shift_cover_requests enable row level security;
alter table shift_cover_acceptances enable row level security;

create policy shift_cover_requests_select on shift_cover_requests for select
  using (is_admin() or is_member_of_store(store_id));

create policy shift_cover_requests_insert on shift_cover_requests for insert
  with check (requested_by = auth.uid() and is_member_of_store(store_id));

create policy shift_cover_requests_update on shift_cover_requests for update
  using (requested_by = auth.uid() or is_admin() or is_manager_of_store(store_id))
  with check (requested_by = auth.uid() or is_admin() or is_manager_of_store(store_id));

-- 관리자 최종 승인(approved) 전환은 admin만 가능하도록 보강
create function guard_shift_cover_request_status() returns trigger as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' and not is_admin() then
    raise exception '대타 요청의 최종 승인은 관리자만 처리할 수 있습니다.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_guard_shift_cover_request_status
  before update on shift_cover_requests
  for each row execute function guard_shift_cover_request_status();

create policy shift_cover_acceptances_select on shift_cover_acceptances for select
  using (
    is_admin()
    or accepted_by = auth.uid()
    or exists (
      select 1 from shift_cover_requests r
      where r.id = shift_cover_acceptances.request_id
        and (r.requested_by = auth.uid() or is_manager_of_store(r.store_id))
    )
  );

create policy shift_cover_acceptances_insert on shift_cover_acceptances for insert
  with check (accepted_by = auth.uid());

create policy shift_cover_acceptances_update on shift_cover_acceptances for update
  using (
    is_admin()
    or accepted_by = auth.uid()
    or exists (
      select 1 from shift_cover_requests r
      where r.id = shift_cover_acceptances.request_id
        and (r.requested_by = auth.uid() or is_manager_of_store(r.store_id))
    )
  );

-- ============ qsc_scores / monthly_achievements / weekly_performance ============
alter table qsc_scores enable row level security;
alter table monthly_achievements enable row level security;
alter table weekly_performance enable row level security;

create policy qsc_scores_select on qsc_scores for select
  using (is_admin() or is_member_of_store(store_id));
create policy qsc_scores_write on qsc_scores for insert with check (is_admin());
create policy qsc_scores_update on qsc_scores for update using (is_admin()) with check (is_admin());

create policy monthly_achievements_select on monthly_achievements for select
  using (is_admin() or is_member_of_store(store_id));
create policy monthly_achievements_write on monthly_achievements for insert with check (is_admin());
create policy monthly_achievements_update on monthly_achievements for update using (is_admin()) with check (is_admin());

create policy weekly_performance_select on weekly_performance for select
  using (is_admin() or is_member_of_store(store_id));
create policy weekly_performance_write on weekly_performance for insert with check (is_admin());
create policy weekly_performance_update on weekly_performance for update using (is_admin()) with check (is_admin());

-- ============ employee_ranks / rank_histories ============
alter table employee_ranks enable row level security;
alter table rank_histories enable row level security;

create policy employee_ranks_select on employee_ranks for select
  using (profile_id = auth.uid() or is_admin());
create policy employee_ranks_write on employee_ranks for insert with check (is_admin());
create policy employee_ranks_update on employee_ranks for update using (is_admin()) with check (is_admin());

create policy rank_histories_select on rank_histories for select
  using (profile_id = auth.uid() or is_admin());
create policy rank_histories_write on rank_histories for insert with check (is_admin());

-- ============ audit_logs ============
alter table audit_logs enable row level security;

create policy audit_logs_select on audit_logs for select
  using (is_admin());
-- insert는 log_audit_event() SECURITY DEFINER 함수를 통해서만 이뤄지며,
-- 일반 클라이언트에게 열어주는 insert 정책은 의도적으로 두지 않습니다.

-- ============ attachments ============
alter table attachments enable row level security;

create policy attachments_select on attachments for select
  using (
    uploaded_by = auth.uid()
    or is_admin()
    or (store_id is not null and is_manager_of_store(store_id))
  );

create policy attachments_insert on attachments for insert
  with check (
    uploaded_by = auth.uid()
    and (store_id is null or is_member_of_store(store_id))
  );

create policy attachments_update on attachments for update
  using (uploaded_by = auth.uid() or is_admin())
  with check (uploaded_by = auth.uid() or is_admin());
