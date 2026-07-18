# 권한 (Permissions)

## 역할

| 역할 | 설명 | 기본 접근 화면 |
| --- | --- | --- |
| `worker` | 근무자 | `/stores/[storeId]` |
| `store_manager` | 매장 관리자 | `/stores/[storeId]` (소속 매장 운영 권한 추가) |
| `senior_manager` | 선임점장 | `/admin` |
| `deputy_manager` | 대리 | `/admin` |
| `administrator` | 전체 관리자 | `/admin` |

로그인 성공 시 역할에 따라 자동으로 위 화면으로 이동합니다
(`src/lib/auth/session.ts`의 `homeHrefForRole`).

## 3단계 방어

1. **`src/proxy.ts`** — 라우트 진입 전 첫 번째 관문. 로그인 여부, 계정 활성화
   여부, `/admin/*`은 관리자 역할인지 확인합니다.
2. **레이아웃/페이지 서버 컴포넌트** — `getSessionUser()`로 다시 한 번 검증합니다
   (예: `src/app/admin/layout.tsx`, `src/app/stores/[storeId]/layout.tsx`).
3. **Supabase RLS** — 최종 방어선. 앱 코드에 버그가 있어도 DB 레벨에서 다른
   매장 데이터나 타인의 데이터에 접근할 수 없습니다.

## 매장 접근 권한

- `worker` / `store_manager`는 본인이 `store_members`로 배정된 매장만 조회 가능.
  다른 매장 주소로 접근하면 RLS가 데이터를 감추고, 레이아웃에서
  `/access-denied?reason=store-mismatch`로 안내합니다.
- `senior_manager` / `deputy_manager` / `administrator`는 모든 매장을 조회할 수
  있습니다 (`is_admin()`이 RLS의 매장 소속 검사를 bypass).

## 기능별 쓰기 권한 요약

| 기능 | 근무자 | 매장 관리자 | 상위 관리자(선임/대리/전체) |
| --- | --- | --- | --- |
| 공지 작성(매장 범위) | ✗ | 본인 매장만 | ✓ (모든 범위) |
| 공지 작성(복수/전체 매장) | ✗ | ✗ | ✓ |
| 정산 제출 | 본인 것만 | 본인 것만 | ✗ (검토만) |
| 정산 검토(확인/수정요청/완료) | ✗ | 본인 매장 | ✓ |
| 휴게 시작/종료 | 본인 것만 | 본인 것만 | ✗ |
| 체크리스트 템플릿 관리 | ✗ | ✗ | ✓ |
| 체크리스트 제출 | 본인 것만 | 본인 것만 | ✗ |
| 체크리스트 검토 | ✗ | 본인 매장 | ✓ |
| 대타 요청/수락 | ✓ | ✓ | ✗ (직접 참여 대상 아님) |
| 대타 최종 승인(교차 매장) | ✗ | ✗ | ✓ |
| 등급 변경 | ✗ | ✗ | ✓ |
| 계정 역할/활성 변경 | ✗ | ✗ | `administrator`만 |

## 계정 발급

회원가입 화면은 없습니다. 계정은 관리자가 발급하며, 로그인은 이메일이 아니라
**아이디(username)**로 합니다.

- 운영: `administrator`가 `/admin/accounts`의 "신규 계정 발급" 화면에서 이름/아이디/
  비밀번호/역할/매장을 입력하면 바로 생성됩니다 (내부적으로 `{username}@wakidoki.local`
  형태의 전용 이메일로 Supabase Auth 계정이 만들어짐). 비밀번호 재설정도 같은 화면에서
  관리자가 직접 할 수 있습니다.
- 개발/테스트: `npm run seed:accounts` (5개 역할 테스트 계정)
- 최초 관리자 계정 1개만 위 화면이 없는 상태에서 만들어야 하므로 `DEPLOYMENT.md`의
  수동 생성 절차를 따릅니다.
