# 데이터베이스 구조

전체 SQL은 `supabase/migrations/`에 순서대로 있습니다. 이 문서는 설계 의도를 정리합니다.

## 테이블 목록 (21개)

2단계에서 정의한 20개 + 14단계에서 추가한 `notifications` 1개.

| 영역 | 테이블 |
| --- | --- |
| 핵심 | `profiles`, `stores`, `store_members`, `attachments` |
| 공지 | `notices`, `notice_stores`, `notice_attachments`, `notice_reads` |
| 체크리스트 | `checklists`, `checklist_items`, `checklist_submissions`, `checklist_item_submissions` |
| 정산/휴게 | `settlements`, `breaks` |
| 대타 | `shift_cover_requests`, `shift_cover_acceptances` |
| 성과 | `qsc_scores`, `monthly_achievements`, `weekly_performance` |
| 등급 | `employee_ranks`, `rank_histories` |
| 기록/알림 | `audit_logs`, `notifications` |

## 왜 `notifications`가 20개 목록 밖에 있는가

2단계 설계 당시 확정한 20개 테이블에는 알림 테이블이 없었습니다. 14단계(알림과 기록
관리)에서 "읽음/안읽음 구분, 알림 목록, 배지" 기능을 요구하는데, 이는 사용자별 읽음
상태를 어딘가에 영속시켜야만 구현 가능하므로 `notifications` 테이블을 추가했습니다.
`audit_logs`와 동일하게 일반 insert 정책은 열어두지 않고, `create_notification()`
SECURITY DEFINER 함수를 통해서만 기록됩니다 (알림 위조 방지).

## 핵심 설계 결정

- **등급(grade)은 `profiles`가 아니라 `employee_ranks`에 있습니다.** 현재 등급은
  `employee_ranks`(근무자당 1행), 변경 이력은 `rank_histories`에 누적됩니다.
- **체크리스트 템플릿은 매장 전용 또는 브랜드 공통으로 만들 수 있습니다.**
  `checklists.store_id`가 null이면 해당 `brand_type`의 모든 매장에 공통 적용됩니다.
- **정산의 브랜드별 추가 항목은 `extra_fields jsonb`에 저장합니다.** PC/벌툰마다
  다른 스키마를 따로 만들지 않고, 하나의 정산 폼과 테이블을 공유합니다.
- **차액(`variance`), QSC 총점(`qsc_total`), 휴게 시간(`duration_minutes`), 수행도
  비율(`performance_rate`)은 모두 DB의 `GENERATED ALWAYS AS` 계산 컬럼입니다.**
  애플리케이션 코드가 잘못 계산해서 저장된 값과 실제 값이 어긋날 수 없습니다.
- **중복/경합 방지는 가능한 한 DB 제약으로 처리합니다.**
  - `breaks_one_active_per_profile`: 근무자당 종료되지 않은 휴게는 하나만 (부분 유니크 인덱스)
  - `settlements_variance_requires_note`: 차액이 있으면 특이사항 필수 (CHECK)
  - `guard_shift_cover_acceptance` 트리거: 본인 요청 자기 수락 차단, 마감된 요청 수락 차단
  - `guard_shift_cover_request_status` 트리거: 관리자만 최종 승인 처리 가능
  - `guard_profile_self_update` 트리거: 본인이 스스로 role/active/brand_type을 바꿀 수 없음

## RLS 권한 모델

- `worker` / `store_manager`: 본인 데이터 + 소속 매장(`store_members`) 데이터만 조회
- `store_manager`: 소속 매장의 공지 발행, 정산/휴게/대타/체크리스트 검토 가능
- `senior_manager` / `deputy_manager` / `administrator`: 전 매장 데이터 조회/관리
  (`is_admin()` 헬퍼 함수가 RLS 정책마다 이 역할들을 bypass 조건으로 사용)
- 세부 정책은 `supabase/migrations/0012_rls_policies.sql`, 알림은 `0014_notifications.sql` 참고
- 체크리스트 제출 중복 방지(`0015`), 주간 수행도 upsert 제약(`0016`), 대타 승인 트리거 보정 및
  요청당 승인 1건 제약(`0017`)은 17단계 최종 점검에서 추가되었습니다
- `profiles.username`(`0018`): 근무자가 이메일이 아니라 아이디로 로그인할 수 있도록 추가.
  로그인은 `lib/auth/login-actions.ts`에서 아이디 → 실제 auth 이메일로 변환 후 처리하며,
  신규 계정은 `{username}@wakidoki.local` 형태의 내부 전용 이메일로 생성됩니다

## 로컬 검증

실제 Supabase 프로젝트 없이도, 로컬 PostgreSQL에 `auth.users`/`auth.uid()`/
`storage.objects` 등을 최소 스텁으로 재현해 전체 마이그레이션 + RLS + 트리거를
실제로 실행하며 검증했습니다 (교차 매장 차단, 중복 휴게 차단, 자기 수락 차단,
정산 차액 특이사항 필수, 알림 위조 차단 등).
