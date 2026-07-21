-- 사용자 요청으로 QSC 점수 기능(및 이를 60% 반영하던 종합점수 화면)을 완전히 폐기합니다.
-- qsc_scores 테이블을 삭제하고, monthly_achievements.total_score는 qsc/queries.ts에서
-- 온디맨드로 계산되던 값이라 컬럼 자체에는 항상 null만 저장되어 있었으므로 함께 제거합니다.
-- (테이블 삭제 시 관련 RLS 정책/트리거는 Postgres가 자동으로 함께 제거합니다.)

drop table if exists qsc_scores;
alter table monthly_achievements drop column if exists total_score;
