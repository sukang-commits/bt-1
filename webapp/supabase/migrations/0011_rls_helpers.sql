-- RLS 정책에서 반복적으로 쓰이는 권한 판별 함수
-- SECURITY DEFINER + 테이블 소유자(postgres) 권한으로 실행되어 profiles/store_members
-- 조회 시 그 테이블들의 RLS를 재귀적으로 타지 않습니다 (Supabase의 표준 패턴).

create function my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('senior_manager', 'deputy_manager', 'administrator')
     from profiles where id = auth.uid()),
    false
  );
$$;

create function is_store_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'store_manager' from profiles where id = auth.uid()), false);
$$;

create function is_member_of_store(p_store_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from store_members
    where profile_id = auth.uid() and store_id = p_store_id
  );
$$;

-- store_manager가 자신이 배정된 매장에 대해 운영 데이터를 관리할 수 있는지
create function is_manager_of_store(p_store_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_store_manager() and is_member_of_store(p_store_id);
$$;
