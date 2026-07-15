# 설치 및 실행 가이드

## 요구 사항

- Node.js 20.9 이상 (Next.js 16 최소 요구 버전)
- npm
- Supabase 프로젝트 (또는 로컬 Supabase CLI 환경)

## 1) 저장소 준비

```bash
cd webapp
npm install
```

## 2) Supabase 프로젝트 생성 및 스키마 적용

1. [supabase.com](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. `supabase/migrations/0001_...` 부터 `0017_...` 까지 파일명 순서대로 SQL Editor에
   붙여넣어 실행합니다 (또는 Supabase CLI의 `supabase db push` 사용).
3. `supabase/seed.sql`을 실행해 16개 매장 기본 데이터를 넣습니다.

자세한 스키마 구조는 `supabase/README.md`, `DATABASE.md`를 참고하세요.

## 3) 환경변수 설정

```bash
cp .env.example .env.local
```

Supabase 프로젝트의 **Project Settings → API**에서 값을 채웁니다.

| 변수 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저에서 사용하는 공개 키 (RLS로 보호됨) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 비밀 키. 계정 발급 스크립트 등에만 사용, 절대 커밋 금지 |

## 4) 테스트 계정 / 데모 데이터 (선택)

```bash
npm run seed:accounts   # 역할별 테스트 계정 5개
npm run seed:demo       # 01호점 중심 데모 데이터
```

## 5) 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다.

## 6) 코드 품질 검사

```bash
npm run lint        # ESLint
npm run typecheck    # TypeScript
npm run test         # vitest (계산 로직 단위 테스트)
npm run build        # 프로덕션 빌드
```

네 가지 모두 커밋 전에 통과하는지 확인하는 것을 권장합니다.

## 참고: Next.js 16 관련 유의사항

- `middleware.ts`가 아니라 `src/proxy.ts`를 사용합니다 (Next.js 16에서 이름이
  바뀌었을 뿐 동작은 동일합니다).
- `cookies()`, `params`, `searchParams`는 모두 비동기(`await` 필요)입니다.
- Turbopack이 기본 빌드/개발 도구입니다 (`--turbopack` 플래그 불필요).
