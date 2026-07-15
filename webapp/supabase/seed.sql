-- 16개 매장 초기 seed 데이터
-- 매장명은 임시로 "NN호점" 형식이며, 관리자 페이지의 매장관리에서 실제 상호명으로 수정할 수 있습니다.
-- brand_type은 우선 홀수=pc, 짝수=beoltoon으로 임시 배정했습니다. 실제 운영 브랜드에 맞게
-- /admin/stores 화면에서 조정해 주세요.

insert into stores (code, name, brand_type, active)
select
  code,
  code || '호점' as name,
  case when (code::int % 2) = 1 then 'pc' else 'beoltoon' end::brand_type as brand_type,
  true
from (
  select lpad(generate_series(1, 16)::text, 2, '0') as code
) as codes
on conflict (code) do nothing;
