# 워키도키 (Wakidoki)

16개 매장의 근무·업무 인증(공지/체크리스트/정산/휴게/대타/QSC/등급)을 관리하는 통합 웹 시스템입니다.
Next.js 16(App Router) + Supabase 기반이며, 모바일 브라우저에서 쓰기 편하도록 반응형으로
만들었습니다. (홈 화면 추가가 가능한 PWA manifest/서비스워커는 아직 없습니다 — 필요하면 추가
구현이 필요합니다.)

> 진행 상황: 1~17단계 전체 완료.

## 문서

- [SETUP.md](./SETUP.md) — 설치/실행 가이드
- [DATABASE.md](./DATABASE.md) — 테이블 구조, 설계 결정, RLS 개요
- [PERMISSIONS.md](./PERMISSIONS.md) — 역할별 권한, 접근 제어 3단계 방어
- [DEPLOYMENT.md](./DEPLOYMENT.md) — 배포 절차, 최초 관리자 계정 생성, 배포 전 체크리스트
- [TESTING.md](./TESTING.md) — 테스트 계정, 필수 시나리오 14가지
- [supabase/README.md](./supabase/README.md) — 마이그레이션 적용 방법

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # Supabase URL/키 채우기
npm run dev
```

Supabase 프로젝트 준비와 마이그레이션 적용은 [SETUP.md](./SETUP.md)를 참고하세요.

## 로그인/권한 요약

- 이메일/비밀번호 로그인 (계정은 관리자가 발급, 회원가입 없음)
- 로그인 세션은 로그아웃 전까지 유지됩니다
- 로그인 후 자동 이동: `worker`/`store_manager` → `/stores/[storeId]`, 나머지 역할 → `/admin`
- `/admin/*`, `/stores/*`, `/notifications`는 `src/proxy.ts`(Next.js 16의 middleware)에서
  로그인 여부·역할·계정 활성화 상태를 확인한 뒤 접근을 허용합니다
- 세부 데이터 접근 권한은 Supabase RLS가 최종적으로 강제합니다 — 자세한 내용은
  [PERMISSIONS.md](./PERMISSIONS.md)

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 타입 검사 |
| `npm run test` | vitest 단위 테스트 (수행도/QSC 계산 로직) |
| `npm run seed:accounts` | 5개 역할 테스트 계정 생성 |
| `npm run seed:demo` | 01호점 중심 데모 데이터 생성 |

## 폴더 구조

```
src/
  app/            App Router 페이지 (stores/[storeId]/*, admin/*, login, notifications 등)
  components/     레이아웃/공통 UI/기능별 컴포넌트
  lib/
    auth/         세션 조회(getSessionUser) 등 인증 헬퍼
    supabase/     브라우저/서버/관리자 Supabase 클라이언트
    notices, settlements, breaks, shift-cover, checklists,
    performance, qsc, ranks, notifications, accounts   기능별 queries/actions
    grades/       등급별 인증 정책 (사진 요구사항)
    storage/      첨부파일 업로드 + 압축
    constants/    메뉴, 상태 배지 등 공통 상수
  types/          도메인 타입, Supabase Database 타입
  proxy.ts        라우트 보호 (Next.js 16의 middleware.ts 대체)
supabase/
  migrations/     스키마 + RLS 정책 SQL (순서대로 적용, 0001~0017)
  seed.sql        16개 매장 초기 데이터
scripts/
  seed-test-accounts.ts   테스트 계정 5개 생성
  seed-demo-data.ts       01호점 중심 데모 데이터 생성
```
