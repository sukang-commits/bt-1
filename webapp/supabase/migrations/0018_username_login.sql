-- 근무자가 이메일이 아니라 간단한 "아이디"로 로그인할 수 있도록 profiles에 username을
-- 추가합니다. 로그인 화면은 이 username을 실제 auth.users.email로 변환한 뒤
-- signInWithPassword를 호출하는 방식으로 동작합니다 (서버 액션에서 처리).
--
-- 기존 계정(이미 이메일로 가입된 관리자 등)은 이메일의 @ 앞부분을 기본 username으로
-- 채워 넣습니다. 이후 신규 계정은 관리자가 /admin/accounts 화면에서 직접 아이디를
-- 지정해 생성합니다 (실제로는 "{username}@wakidoki.local" 형태의 내부용 이메일로 저장됨).

alter table profiles add column username text;

update profiles p
set username = lower(split_part(u.email, '@', 1))
from auth.users u
where u.id = p.id and p.username is null;

alter table profiles alter column username set not null;
alter table profiles add constraint profiles_username_unique unique (username);
create index idx_profiles_username on profiles (username);
