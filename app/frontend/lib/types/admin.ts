/**
 * 管理画面関連の型定義
 */

/** サービス全体の集計統計 */
export type AdminStats = {
  total_users: number;           // 総ユーザー数
  active_users: number;          // 活動中ユーザー数（プランを 1 件以上持つ）
  new_users_this_month: number;  // 当月の新規登録数
  total_plans: number;           // 総プラン数
  plans_by_status: {
    active: number;
    completed: number;
    archived: number;
  };
  total_tasks: number;           // 総タスク数
  tasks_by_status: {
    pending: number;
    in_progress: number;
    completed: number;
  };
};

/** 管理画面用ユーザー一覧の 1 件 */
export type AdminUser = {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  plan_count: number;            // 作成したプラン数
  completed_plan_count: number;  // 完了済みプラン数
  task_count: number;            // 総タスク数
  completed_task_count: number;  // 完了済みタスク数
};
