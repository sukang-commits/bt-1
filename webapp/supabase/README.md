# Supabase 스키마

`migrations/` 폴더의 SQL을 순서대로 적용하면 워키도키 서비스에 필요한 20개 테이블과
RLS 정책이 모두 구성됩니다.

## 적용 방법

### 1) Supabase CLI 사용 (권장)

```bash
supabase link --project-ref <프로젝트 ref>
supabase db push
```

### 2) SQL Editor에 직접 붙여넣기

`migrations/0001_...` 부터 파일명 순서대로 Supabase 대시보드의 SQL Editor에서 실행합니다
(`0013_storage_bucket.sql`은 사진/파일 첨부용 Storage 버킷과 정책을 만듭니다).

적용 후 `seed.sql`을 실행하면 16개 매장 기본 데이터가 생성됩니다.

## 로컬 검증

이 스키마는 로컬 PostgreSQL에 `auth.users`/`storage.objects` 등을 최소 스텁으로 재현한 환경에서
전체 마이그레이션 적용 + RLS 정책(교차 매장 차단, 중복 휴게 시작 차단, 본인 요청 자기 수락 차단,
정산 차액 특이사항 필수, Storage 경로 기반 매장 접근 제어, 공지 범위별 노출·확인 현황 집계 등)을
실제로 실행해 확인했습니다.

## 구조 요약

- **핵심**: `attachments`, `profiles`, `stores`, `store_members`
- **공지**: `notices`, `notice_stores`, `notice_attachments`, `notice_reads`
- **체크리스트**: `checklists`, `checklist_items`, `checklist_submissions`, `checklist_item_submissions`
- **정산/휴게**: `settlements`, `breaks`
- **대타**: `shift_cover_requests`, `shift_cover_acceptances`
- **성과**: `qsc_scores`, `monthly_achievements`, `weekly_performance`
- **등급**: `employee_ranks`, `rank_histories`
- **감사 기록**: `audit_logs` (일반 insert 정책 없음 — `log_audit_event()` SECURITY DEFINER 함수로만 기록)

## 권한 모델 (RLS)

- `worker`: 본인 데이터 + 소속 매장의 공개 데이터 조회, 본인 데이터 작성
- `store_manager`: 소속 매장(store_members)의 운영 데이터(공지 발행, 정산/휴게/대타 검토 등) 관리
- `senior_manager` / `deputy_manager` / `administrator`: 전 매장 데이터 조회/관리 (`/admin` 접근 가능)
- 계정 발급(`profiles` insert), 체크리스트 템플릿, QSC 점수, 등급 변경은 관리자 전용

세부 정책은 `migrations/0012_rls_policies.sql`을 참고하세요.
