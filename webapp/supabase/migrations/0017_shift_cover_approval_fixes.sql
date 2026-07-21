-- 17단계 최종 점검에서 발견한 두 가지 문제를 수정합니다.
--
-- 1) guard_shift_cover_request_status가 관리자가 아닌 사용자의 모든 status='approved'
--    전환을 막고 있었습니다. 그런데 chooseAcceptance()의 "같은 매장 수락자 선택 시 즉시
--    승인" 분기는 요청자(비관리자)가 직접 상태를 approved로 바꾸므로, 이 트리거 때문에
--    같은 매장 대타 수락은 항상 예외가 발생해 실패했습니다. 이미 해당 요청에 대해
--    승인된 비교차매장(cross-store가 아닌) 수락 건이 존재하는 경우는 허용하도록 완화합니다.
create or replace function guard_shift_cover_request_status() returns trigger as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' and not is_admin() then
    if not exists (
      select 1 from shift_cover_acceptances
      where request_id = new.id and status = 'approved' and is_cross_store = false
    ) then
      raise exception '대타 요청의 최종 승인은 관리자만 처리할 수 있습니다.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2) chooseAcceptance()/approveAcceptance()가 상태 가드 없이 update를 실행해, 같은 요청에
--    대해 두 수락 건이 동시에 승인 처리되는 경합이 가능했습니다. 요청당 승인된 수락은
--    최대 1건이어야 하므로 partial unique index로 DB에서 강제합니다.
create unique index shift_cover_acceptances_one_approved_per_request
  on shift_cover_acceptances (request_id)
  where status = 'approved';
