-- 사용자 요청: 매장 관리자(store_manager)가 자기 매장의 체크리스트(업무) 템플릿과
-- 항목을 직접 추가/수정할 수 있어야 합니다. 지금까지는 is_admin()만 허용되어 있어서
-- store_manager는 자기 매장 체크리스트조차 손댈 수 없었습니다.
--
-- 브랜드 공통 템플릿(store_id가 null, 여러 매장에 동시 적용)은 여러 매장에 영향을
-- 주므로 계속 상위 관리자(선임/대리/전체) 전용으로 남겨두고, store_id가 지정된
-- "매장 전용" 템플릿만 해당 매장의 store_manager에게 허용합니다.

drop policy if exists checklists_write on checklists;
create policy checklists_write on checklists for insert
  with check (is_admin() or (store_id is not null and is_manager_of_store(store_id)));

drop policy if exists checklists_update on checklists;
create policy checklists_update on checklists for update
  using (is_admin() or (store_id is not null and is_manager_of_store(store_id)))
  with check (is_admin() or (store_id is not null and is_manager_of_store(store_id)));

drop policy if exists checklist_items_write on checklist_items;
create policy checklist_items_write on checklist_items for insert
  with check (
    exists (
      select 1 from checklists c
      where c.id = checklist_items.checklist_id
        and (is_admin() or (c.store_id is not null and is_manager_of_store(c.store_id)))
    )
  );

drop policy if exists checklist_items_update on checklist_items;
create policy checklist_items_update on checklist_items for update
  using (
    exists (
      select 1 from checklists c
      where c.id = checklist_items.checklist_id
        and (is_admin() or (c.store_id is not null and is_manager_of_store(c.store_id)))
    )
  )
  with check (
    exists (
      select 1 from checklists c
      where c.id = checklist_items.checklist_id
        and (is_admin() or (c.store_id is not null and is_manager_of_store(c.store_id)))
    )
  );
