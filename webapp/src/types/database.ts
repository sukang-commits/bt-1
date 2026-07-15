// supabase/migrations의 스키마를 반영한 수기 작성 타입입니다.
// 실제 프로젝트 연결 후에는 `supabase gen types typescript --linked`로 재생성해
// 이 파일을 교체하는 것을 권장합니다.

export type UserRoleEnum =
  | "worker"
  | "store_manager"
  | "senior_manager"
  | "deputy_manager"
  | "administrator";

export type BrandTypeEnum = "pc" | "beoltoon";

export type EmployeeGradeEnum =
  | "silver"
  | "gold"
  | "diamond"
  | "challenger"
  | "worker_bee"
  | "honey_bee"
  | "queen_bee"
  | "royal_bee";

export type WorkShiftEnum = "open" | "middle" | "close" | "night";
export type NoticeScopeEnum = "store" | "multi_store" | "all_stores";
export type ChecklistTypeEnum =
  | "open"
  | "middle"
  | "close"
  | "kitchen"
  | "hall"
  | "settlement"
  | "weekly"
  | "monthly";
export type ChecklistSubmissionStatusEnum = "submitted" | "needs_supplement" | "confirmed";
export type SettlementStatusEnum =
  | "draft"
  | "submitted"
  | "confirmed"
  | "revision_requested"
  | "completed";
export type BreakStatusEnum = "in_progress" | "completed" | "needs_review";
export type ShiftCoverStatusEnum =
  | "recruiting"
  | "pending_acceptance"
  | "pending_admin_approval"
  | "approved"
  | "cancelled"
  | "closed";
export type ShiftCoverAcceptanceStatusEnum = "pending" | "approved" | "rejected";
export type RankChangeTypeEnum = "promotion" | "demotion" | "honor_grant";
export type AttachmentCategoryEnum = "notice" | "settlement" | "break" | "checklist" | "issue";

interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface AttachmentRow {
  id: string;
  category: AttachmentCategoryEnum;
  store_id: string | null;
  uploaded_by: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  created_at: string;
  deleted_at: string | null;
}

export interface ProfileRow extends Timestamps {
  id: string;
  name: string;
  phone: string | null;
  role: UserRoleEnum;
  brand_type: BrandTypeEnum;
  active: boolean;
}

export interface StoreRow extends Timestamps {
  id: string;
  code: string;
  name: string;
  brand_type: BrandTypeEnum;
  address: string | null;
  active: boolean;
}

export interface StoreMemberRow {
  id: string;
  store_id: string;
  profile_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface NoticeRow extends Timestamps {
  id: string;
  title: string;
  content: string;
  scope: NoticeScopeEnum;
  store_id: string | null;
  is_important: boolean;
  requires_ack: boolean;
  publish_at: string;
  ack_due_at: string | null;
  created_by: string;
  deleted_at: string | null;
}

export interface NoticeStoreRow {
  id: string;
  notice_id: string;
  store_id: string;
}

export interface NoticeAttachmentRow {
  id: string;
  notice_id: string;
  attachment_id: string;
}

export interface NoticeReadRow {
  id: string;
  notice_id: string;
  profile_id: string;
  read_at: string;
}

export interface ChecklistRow extends Timestamps {
  id: string;
  store_id: string | null;
  brand_type: BrandTypeEnum;
  type: ChecklistTypeEnum;
  name: string;
  active: boolean;
  deleted_at: string | null;
}

export interface ChecklistItemRow extends Timestamps {
  id: string;
  checklist_id: string;
  label: string;
  description: string | null;
  is_required: boolean;
  requires_photo: boolean;
  is_core: boolean;
  work_shift: WorkShiftEnum | null;
  sort_order: number;
  active: boolean;
  deleted_at: string | null;
}

export interface ChecklistSubmissionRow extends Timestamps {
  id: string;
  checklist_id: string;
  store_id: string;
  profile_id: string;
  work_date: string;
  status: ChecklistSubmissionStatusEnum;
  progress_rate: number;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  submitted_at: string;
}

export interface ChecklistItemSubmissionRow extends Timestamps {
  id: string;
  submission_id: string;
  checklist_item_id: string;
  is_checked: boolean;
  photo_attachment_id: string | null;
  note: string | null;
}

export interface SettlementRow extends Timestamps {
  id: string;
  store_id: string;
  profile_id: string;
  work_date: string;
  work_shift: WorkShiftEnum;
  pos_amount: number;
  cash_amount: number;
  card_confirmed: boolean;
  variance: number;
  note: string | null;
  photo_attachment_id: string | null;
  status: SettlementStatusEnum;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  revision_reason: string | null;
  extra_fields: Record<string, unknown>;
}

export interface BreakRow extends Timestamps {
  id: string;
  store_id: string;
  profile_id: string;
  work_date: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  status: BreakStatusEnum;
  photo_attachment_id: string | null;
  note: string | null;
}

export interface ShiftCoverRequestRow extends Timestamps {
  id: string;
  store_id: string;
  requested_by: string;
  work_date: string;
  start_time: string;
  end_time: string;
  position: string | null;
  reason: string | null;
  is_urgent: boolean;
  status: ShiftCoverStatusEnum;
  cancelled_at: string | null;
}

export interface ShiftCoverAcceptanceRow extends Timestamps {
  id: string;
  request_id: string;
  accepted_by: string;
  is_cross_store: boolean;
  status: ShiftCoverAcceptanceStatusEnum;
  admin_approved_by: string | null;
  admin_approved_at: string | null;
}

export interface QscScoreRow extends Timestamps {
  id: string;
  store_id: string;
  year_month: string;
  quality_score: number;
  service_score: number;
  cleanliness_score: number;
  qsc_total: number;
  item_scores: Record<string, number>;
  admin_comment: string | null;
  created_by: string;
}

export interface MonthlyAchievementRow extends Timestamps {
  id: string;
  store_id: string;
  year_month: string;
  weekly_performance_rate: number;
  settlement_rate: number;
  notice_ack_rate: number;
  break_auth_rate: number;
  task_completion_score: number;
  achievement_rate: number;
  previous_month_diff: number | null;
  total_score: number | null;
}

export interface WeeklyPerformanceRow extends Timestamps {
  id: string;
  store_id: string;
  profile_id: string | null;
  week_start_date: string;
  day_of_week: number | null;
  required_tasks_total: number;
  required_tasks_completed: number;
  performance_rate: number;
}

export interface EmployeeRankRow extends Timestamps {
  id: string;
  profile_id: string;
  grade: EmployeeGradeEnum;
  is_honor_grade: boolean;
  effective_from: string;
  updated_by: string | null;
}

export interface RankHistoryRow {
  id: string;
  profile_id: string;
  previous_grade: EmployeeGradeEnum | null;
  new_grade: EmployeeGradeEnum;
  change_type: RankChangeTypeEnum;
  reason: string | null;
  changed_by: string;
  effective_date: string;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

// Row에서 created_at/updated_at처럼 DB 기본값이 있는 컬럼을 Insert 시 선택적으로 만들어 줍니다.
type WithDefaults<Row, DefaultedKeys extends keyof Row> = Omit<Row, DefaultedKeys> &
  Partial<Pick<Row, DefaultedKeys>>;

export interface Database {
  public: {
    Tables: {
      attachments: TableDef<
        AttachmentRow,
        WithDefaults<AttachmentRow, "id" | "created_at" | "deleted_at">
      >;
      profiles: TableDef<
        ProfileRow,
        WithDefaults<ProfileRow, "active" | "created_at" | "updated_at">
      >;
      stores: TableDef<
        StoreRow,
        WithDefaults<StoreRow, "id" | "active" | "created_at" | "updated_at">
      >;
      store_members: TableDef<
        StoreMemberRow,
        WithDefaults<StoreMemberRow, "id" | "is_primary" | "created_at">
      >;
      notices: TableDef<
        NoticeRow,
        WithDefaults<
          NoticeRow,
          | "id"
          | "is_important"
          | "requires_ack"
          | "publish_at"
          | "ack_due_at"
          | "created_at"
          | "updated_at"
          | "deleted_at"
        >
      >;
      notice_stores: TableDef<NoticeStoreRow, WithDefaults<NoticeStoreRow, "id">>;
      notice_attachments: TableDef<NoticeAttachmentRow, WithDefaults<NoticeAttachmentRow, "id">>;
      notice_reads: TableDef<NoticeReadRow, WithDefaults<NoticeReadRow, "id" | "read_at">>;
      checklists: TableDef<
        ChecklistRow,
        WithDefaults<ChecklistRow, "id" | "active" | "created_at" | "updated_at" | "deleted_at">
      >;
      checklist_items: TableDef<
        ChecklistItemRow,
        WithDefaults<
          ChecklistItemRow,
          | "id"
          | "is_required"
          | "requires_photo"
          | "is_core"
          | "sort_order"
          | "active"
          | "created_at"
          | "updated_at"
          | "deleted_at"
        >
      >;
      checklist_submissions: TableDef<
        ChecklistSubmissionRow,
        WithDefaults<
          ChecklistSubmissionRow,
          | "id"
          | "status"
          | "progress_rate"
          | "submitted_at"
          | "created_at"
          | "updated_at"
        >
      >;
      checklist_item_submissions: TableDef<
        ChecklistItemSubmissionRow,
        WithDefaults<
          ChecklistItemSubmissionRow,
          "id" | "is_checked" | "created_at" | "updated_at"
        >
      >;
      settlements: TableDef<
        SettlementRow,
        WithDefaults<
          SettlementRow,
          | "id"
          | "card_confirmed"
          | "variance"
          | "status"
          | "extra_fields"
          | "created_at"
          | "updated_at"
        >
      >;
      breaks: TableDef<
        BreakRow,
        WithDefaults<
          BreakRow,
          | "id"
          | "work_date"
          | "started_at"
          | "duration_minutes"
          | "status"
          | "created_at"
          | "updated_at"
        >
      >;
      shift_cover_requests: TableDef<
        ShiftCoverRequestRow,
        WithDefaults<
          ShiftCoverRequestRow,
          "id" | "is_urgent" | "status" | "created_at" | "updated_at"
        >
      >;
      shift_cover_acceptances: TableDef<
        ShiftCoverAcceptanceRow,
        WithDefaults<
          ShiftCoverAcceptanceRow,
          "id" | "is_cross_store" | "status" | "created_at" | "updated_at"
        >
      >;
      qsc_scores: TableDef<
        QscScoreRow,
        WithDefaults<
          QscScoreRow,
          "id" | "qsc_total" | "item_scores" | "created_at" | "updated_at"
        >
      >;
      monthly_achievements: TableDef<
        MonthlyAchievementRow,
        WithDefaults<MonthlyAchievementRow, "id" | "created_at" | "updated_at">
      >;
      weekly_performance: TableDef<
        WeeklyPerformanceRow,
        WithDefaults<
          WeeklyPerformanceRow,
          | "id"
          | "required_tasks_total"
          | "required_tasks_completed"
          | "performance_rate"
          | "created_at"
          | "updated_at"
        >
      >;
      employee_ranks: TableDef<
        EmployeeRankRow,
        WithDefaults<
          EmployeeRankRow,
          "id" | "is_honor_grade" | "effective_from" | "created_at" | "updated_at"
        >
      >;
      rank_histories: TableDef<RankHistoryRow, WithDefaults<RankHistoryRow, "id" | "effective_date" | "created_at">>;
      audit_logs: TableDef<
        AuditLogRow,
        WithDefaults<
          AuditLogRow,
          "id" | "before_data" | "after_data" | "ip_address" | "user_agent" | "created_at"
        >
      >;
    };
    Views: Record<string, never>;
    Functions: {
      log_audit_event: {
        Args: {
          p_actor_id: string | null;
          p_action: string;
          p_target_table: string;
          p_target_id: string | null;
          p_before_data?: Record<string, unknown> | null;
          p_after_data?: Record<string, unknown> | null;
          p_ip_address?: string | null;
          p_user_agent?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRoleEnum;
      brand_type: BrandTypeEnum;
      employee_grade: EmployeeGradeEnum;
      work_shift: WorkShiftEnum;
      notice_scope: NoticeScopeEnum;
      checklist_type: ChecklistTypeEnum;
      checklist_submission_status: ChecklistSubmissionStatusEnum;
      settlement_status: SettlementStatusEnum;
      break_status: BreakStatusEnum;
      shift_cover_status: ShiftCoverStatusEnum;
      shift_cover_acceptance_status: ShiftCoverAcceptanceStatusEnum;
      rank_change_type: RankChangeTypeEnum;
      attachment_category: AttachmentCategoryEnum;
    };
  };
}
