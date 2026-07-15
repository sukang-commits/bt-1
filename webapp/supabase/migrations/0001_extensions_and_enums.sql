-- 워키도키 스키마: 확장 모듈 및 enum 타입
-- 실행 순서상 가장 먼저 적용되어야 합니다.

create extension if not exists "pgcrypto";

create type user_role as enum (
  'worker',
  'store_manager',
  'senior_manager',
  'deputy_manager',
  'administrator'
);

create type brand_type as enum ('pc', 'beoltoon');

create type employee_grade as enum (
  'silver', 'gold', 'diamond', 'challenger',
  'worker_bee', 'honey_bee', 'queen_bee', 'royal_bee'
);

create type work_shift as enum ('open', 'middle', 'close', 'night');

create type notice_scope as enum ('store', 'multi_store', 'all_stores');

create type checklist_type as enum (
  'open', 'middle', 'close', 'kitchen', 'hall', 'settlement', 'weekly', 'monthly'
);

create type checklist_submission_status as enum (
  'submitted', 'needs_supplement', 'confirmed'
);

create type settlement_status as enum (
  'draft', 'submitted', 'confirmed', 'revision_requested', 'completed'
);

create type break_status as enum ('in_progress', 'completed', 'needs_review');

create type shift_cover_status as enum (
  'recruiting', 'pending_acceptance', 'pending_admin_approval',
  'approved', 'cancelled', 'closed'
);

create type shift_cover_acceptance_status as enum ('pending', 'approved', 'rejected');

create type rank_change_type as enum ('promotion', 'demotion', 'honor_grant');

create type attachment_category as enum (
  'notice', 'settlement', 'break', 'checklist', 'issue'
);
