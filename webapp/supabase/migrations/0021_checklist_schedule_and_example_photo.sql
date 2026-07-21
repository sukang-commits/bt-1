-- 사용자 요청: 주간/월간 체크리스트를 "몇째 주 무슨 요일"처럼 특정 날짜에만
-- 필요하도록 설정하고, 항목마다 설명과 예시 사진을 등록해 근무자가 확인 후
-- 작업할 수 있게 합니다.
--
-- schedule_day_of_week: 0=일요일 ~ 6=토요일. weekly 타입은 이 값만 쓰고,
-- monthly 타입은 schedule_week_of_month(1~4=그 주, 5="마지막 주")와 함께 씁니다.
-- 둘 다 null이면 기존과 동일하게 매일 노출됩니다(하위 호환).

alter table checklists
  add column schedule_day_of_week smallint,
  add column schedule_week_of_month smallint;

alter table checklists
  add constraint checklists_schedule_day_of_week_check
  check (schedule_day_of_week is null or schedule_day_of_week between 0 and 6);

alter table checklists
  add constraint checklists_schedule_week_of_month_check
  check (schedule_week_of_month is null or schedule_week_of_month between 1 and 5);

alter table checklist_items
  add column example_photo_attachment_id uuid references attachments (id);
