-- 17단계 최종 점검에서 발견: recomputeWeeklyPerformance()가
-- onConflict: "store_id,week_start_date,day_of_week"로 upsert하지만
-- weekly_performance 테이블에는 이 세 컬럼에 대한 unique 제약이 없어
-- (인덱스만 존재) ON CONFLICT 자체가 Postgres 에러로 실패합니다.
-- profile_id는 현재 유일한 쓰기 경로에서 항상 null이며, unique 제약에
-- profile_id를 포함하면 Postgres가 각 null을 서로 다른 값으로 취급해
-- 매장 단위 중복 방지가 무력화되므로 의도적으로 제외합니다.

alter table weekly_performance
  add constraint weekly_performance_unique_per_day
  unique (store_id, week_start_date, day_of_week);
