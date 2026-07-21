-- 17단계 최종 점검에서 발견: checklist_submissions에는 "하루에 하나의 체크리스트를
-- 한 근무자가 한 번만 제출한다"는 제약이 DB에 없어, 이중 클릭이나 동시 요청 시
-- 중복 제출 행이 생길 수 있었습니다 (앱 코드는 select-then-insert/update 방식이라
-- 두 요청이 동시에 들어오면 경합이 발생합니다). upsert로 원자적으로 처리할 수 있도록
-- unique 제약을 추가합니다.

alter table checklist_submissions
  add constraint checklist_submissions_unique_per_day
  unique (checklist_id, profile_id, work_date);
