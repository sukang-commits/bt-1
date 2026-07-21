# 배포 가이드

## 배포 대상

Next.js 16(App Router) 프로젝트로, Vercel 배포를 기준으로 작성했습니다. Node.js
런타임을 지원하는 다른 플랫폼(자체 서버, Docker 등)에서도 동일하게 동작합니다.

## 1) Supabase 프로젝트 준비

`SETUP.md`의 2~4단계(마이그레이션 적용, seed 실행, 환경변수 확인)를 먼저
운영용 Supabase 프로젝트에 대해 완료합니다. 테스트 계정/데모 데이터
스크립트(`seed:accounts`, `seed:demo`)는 운영 환경에는 실행하지 마세요.

## 2) 환경변수

배포 플랫폼에 다음 값을 설정합니다 (`.env.example` 참고).

| 변수 | 비고 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 변수로만 등록 (클라이언트 번들 노출 금지) |

## 3) Supabase Storage

`supabase/migrations/0013_storage_bucket.sql`이 `attachments` 버킷과 정책을
만듭니다. Supabase 대시보드에서 버킷이 정상 생성됐는지, 파일 크기 제한(10MB)과
허용 MIME 타입(jpeg/png/webp/pdf)이 적용됐는지 확인하세요.

## 4) 빌드/배포

```bash
npm run build
npm run start   # 또는 배포 플랫폼의 표준 빌드 파이프라인 사용
```

Vercel을 사용하는 경우 저장소를 연결하고 위 환경변수만 등록하면 `next build`가
자동으로 실행됩니다.

## 5) 최초 관리자 계정 생성

로그인은 이메일이 아니라 **아이디(username)**로 합니다 (`profiles.username`).
`0018_username_login.sql` 적용 시 기존 이메일 계정은 `@` 앞부분이 자동으로
아이디가 됩니다. 최초 관리자 계정은 아직 이 방식이 없으므로 수동으로 만듭니다.

1. Supabase 대시보드 **Authentication → Users**에서 이메일/비밀번호로 사용자를
   생성합니다 (또는 `auth.admin.createUser` API 사용). 이메일은 실제 이메일이든
   아무 형식이든 상관없습니다 (로그인에는 아이디만 쓰입니다).
2. 생성된 사용자 `id`로 `profiles` 테이블에 행을 추가합니다. `username`이 바로
   로그인 아이디입니다.
   ```sql
   insert into profiles (id, username, name, phone, role, brand_type, active)
   values ('<auth user id>', '<로그인용 아이디>', '관리자 이름', null, 'administrator', 'pc', true);
   ```
3. 필요하면 `employee_ranks`에도 등급을 추가합니다 (없어도 로그인/이용에는
   문제없이 기본 등급으로 표시됩니다).
4. 이후 근무자 계정은 이 관리자 계정으로 로그인해서 `/admin/accounts` 화면의
   **"신규 계정 발급"**에서 이름/아이디/비밀번호/역할/매장을 입력해 바로 만들 수
   있습니다 (스크립트나 Supabase API를 직접 쓸 필요 없음).

## 6) 16개 매장 실제 상호명으로 변경

`/admin/stores`(매장관리) 화면에서 매장명을 실제 상호명으로 수정하거나,
Supabase SQL Editor에서 직접 업데이트합니다.

```sql
update stores set name = '실제 매장명' where code = '01';
```

## 7) 배포 전 최종 체크리스트

- [ ] `npm run lint / typecheck / test / build` 모두 통과
- [ ] Supabase 마이그레이션 0001~0021 전체 적용 확인
- [ ] Storage 버킷(`attachments`) 생성 및 정책 확인
- [ ] 환경변수 3개 등록 확인 (`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용으로만)
- [ ] 최초 관리자 계정 생성 및 로그인 확인
- [ ] 16개 매장명을 실제 상호명으로 교체
- [ ] 매장별 체크리스트 템플릿 등록 (관리자는 `/admin/checklists`, 매장 관리자는
      `/stores/{storeId}/checklist/manage`에서 본인 매장 것만 직접 등록 가능)
- [ ] 근무자 계정 발급 및 소속 매장/등급 배정
- [ ] 테스트/데모 데이터가 운영 DB에 남아있지 않은지 확인
