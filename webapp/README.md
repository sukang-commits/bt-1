# 워키도키 (Wakidoki)

16개 매장의 근무·업무 인증(공지/체크리스트/정산/휴게/대타/QSC/등급)을 관리하는 통합 웹 시스템입니다.
Next.js 16(App Router) + Supabase 기반이며, 모바일에서 앱처럼 쓸 수 있는 PWA로 만들어지고 있습니다.

> 진행 상황: 1~3단계(초기 구성/공통 레이아웃, Supabase 스키마, 로그인·권한) 완료.
> 상세 계획은 저장소 히스토리의 커밋 메시지를 참고하세요.

## 시작하기

### 1) Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com)에서 프로젝트를 만듭니다.
2. `supabase/migrations`의 SQL을 순서대로 적용합니다 (자세한 방법은 `supabase/README.md`).
3. `supabase/seed.sql`을 실행해 16개 매장 기본 데이터를 넣습니다.

### 2) 환경변수 설정

```bash
cp .env.example .env.local
```

Supabase 프로젝트의 **Project Settings → API**에서 URL/anon key/service role key를 채워주세요.

### 3) 의존성 설치 및 실행

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

### 4) 테스트 계정 만들기 (선택)

5개 역할(근무자/매장 관리자/선임점장/대리/전체 관리자)의 테스트 계정을 한 번에 만들어 줍니다.

```bash
npm run seed:accounts
```

공통 비밀번호는 스크립트 상단(`scripts/seed-test-accounts.ts`)에 있는 `Wakidoki!2026`이며,
운영 배포 전에는 반드시 삭제하거나 비밀번호를 교체해야 합니다.

## 로그인/권한 요약

- 이메일/비밀번호 로그인 (계정은 관리자가 발급, 회원가입 없음)
- 로그인 세션은 로그아웃 전까지 유지됩니다
- 로그인 후 자동 이동: `worker`/`store_manager` → `/stores/[storeId]`, 나머지 역할 → `/admin`
- `/admin/*`, `/stores/*`는 `src/proxy.ts`(Next.js 16의 middleware)에서 로그인 여부·역할·계정
  활성화 상태를 확인한 뒤 접근을 허용합니다
- 세부 데이터 접근 권한은 Supabase RLS(`supabase/migrations/0012_rls_policies.sql`)가 최종적으로 강제합니다

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run seed:accounts` | 5개 역할 테스트 계정 생성 |

## 폴더 구조

```
src/
  app/            App Router 페이지 (login, stores/[storeId], admin, access-denied, reset-password)
  components/     레이아웃/공통 UI 컴포넌트
  lib/
    auth/         세션 조회(getSessionUser) 등 인증 헬퍼
    supabase/     브라우저/서버/관리자 Supabase 클라이언트
    constants/    메뉴, 상태 배지 등 공통 상수
  types/          도메인 타입, Supabase Database 타입
  proxy.ts        라우트 보호 (Next.js 16의 middleware.ts 대체)
supabase/
  migrations/     스키마 + RLS 정책 SQL (순서대로 적용)
  seed.sql        16개 매장 초기 데이터
scripts/
  seed-test-accounts.ts  테스트 계정 생성 스크립트
```
