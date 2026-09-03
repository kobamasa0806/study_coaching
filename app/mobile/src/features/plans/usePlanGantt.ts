/**
 * ガントチャート画面用のデータ管理 hook。
 * Web版 (app/frontend/features/plans/usePlanGantt.ts) の移植。
 * - 初回ロード時にユーザーの計画とタスクを API から取得する
 * - 計画がなければデフォルト計画を自動作成する
 * - 変更は debounce してバックグラウンドで API に保存する
 * Web版と異なり、API失敗時の localStorage フォールバックは持たず、通常のエラー状態にする。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPlan, getPlan, getPlans } from "@/lib/api/plans";
import { createTask, deleteTask, getTasks, updateTask } from "@/lib/api/tasks";
import type { Plan, Task } from "@/lib/types/plans";
import type { GanttItem, GanttRowType } from "./types";

function taskToGanttItem(task: Task): GanttItem {
  return {
    id: task.id,
    name: task.title,
    planDates: task.plan_dates,
    actualDates: task.actual_dates,
  };
}

type UsePlanGanttReturn = {
  items: GanttItem[];
  isLoading: boolean;
  error: string | null;
  planId: string | null;
  /** 学習プランの目標日（"yyyy-MM-dd" 形式） */
  targetDate: string | null;
  addItem: (name: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItemName: (id: string, name: string) => void;
  toggleDates: (
    itemId: string,
    rowType: GanttRowType,
    datesToToggle: string[],
    fill: boolean
  ) => void;
};

type UsePlanGanttOptions = {
  /** 指定時はこのプランIDを使う。未指定時は最初のプランを使う（無ければ自動作成） */
  initialPlanId?: string | null;
};

/** デバウンス保存のウェイト時間（ms） */
const SAVE_DEBOUNCE_MS = 800;

const DEFAULT_TASK_TITLES = [
  "第1章 基礎知識",
  "第2章 重要概念",
  "第3章 応用理論",
  "過去問演習",
  "模擬試験・総復習",
];

export function usePlanGantt({ initialPlanId }: UsePlanGanttOptions = {}): UsePlanGanttReturn {
  const [items, setItems] = useState<GanttItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string | null>(null);

  /** タスク情報のキャッシュ（order や status 保持用） */
  const taskCacheRef = useRef<Map<string, Task>>(new Map());
  /** debounce タイマーの管理 */
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    // アンマウント後の状態更新を防ぐための ignore フラグ
    let ignore = false;

    (async () => {
      try {
        let plan: Plan;

        if (initialPlanId) {
          plan = await getPlan(initialPlanId);
          if (ignore) return;
        } else {
          let plans = await getPlans();
          if (ignore) return;

          if (plans.length === 0) {
            const today = new Date();
            const target = new Date(today);
            target.setMonth(target.getMonth() + 3);
            const newPlan = await createPlan({
              title: "学習プラン",
              description: "",
              target_date: target.toISOString().slice(0, 10),
            });
            if (ignore) return;
            plans = [newPlan];
          }

          plan = plans[0];
        }
        setPlanId(plan.id);
        setTargetDate(plan.target_date);

        const tasks = await getTasks(plan.id);
        if (ignore) return;

        tasks.forEach((t) => taskCacheRef.current.set(t.id, t));

        if (tasks.length === 0) {
          const created: GanttItem[] = [];
          for (const title of DEFAULT_TASK_TITLES) {
            const task = await createTask(plan.id, { title });
            if (ignore) return;
            taskCacheRef.current.set(task.id, task);
            created.push(taskToGanttItem(task));
          }
          setItems(created);
        } else {
          setItems(tasks.map(taskToGanttItem));
        }
      } catch {
        if (ignore) return;
        setError("学習プランの読み込みに失敗しました。");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [initialPlanId]);

  const scheduleSave = useCallback(
    (item: GanttItem) => {
      if (!planId) return;

      const existing = saveTimersRef.current.get(item.id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(async () => {
        const cached = taskCacheRef.current.get(item.id);
        if (!cached) return;
        try {
          const updated = await updateTask(planId, item.id, {
            title: item.name,
            description: cached.description,
            plan_dates: item.planDates,
            actual_dates: item.actualDates,
            status: cached.status,
            order: cached.order,
          });
          taskCacheRef.current.set(item.id, updated);
        } catch {
          // 保存失敗は無視（次の変更時に再試行）
        }
      }, SAVE_DEBOUNCE_MS);

      saveTimersRef.current.set(item.id, timer);
    },
    [planId]
  );

  const addItem = useCallback(
    async (name: string) => {
      if (!planId) return;
      const task = await createTask(planId, { title: name });
      taskCacheRef.current.set(task.id, task);
      setItems((prev) => [...prev, taskToGanttItem(task)]);
    },
    [planId]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (!planId) return;
      await deleteTask(planId, id);
      taskCacheRef.current.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [planId]
  );

  const updateItemName = useCallback(
    (id: string, name: string) => {
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, name } : i));
        const updated = next.find((i) => i.id === id);
        if (updated) scheduleSave(updated);
        return next;
      });
    },
    [scheduleSave]
  );

  const toggleDates = useCallback(
    (itemId: string, rowType: GanttRowType, datesToToggle: string[], fill: boolean) => {
      setItems((prev) => {
        const next = prev.map((item) => {
          if (item.id !== itemId) return item;
          const field = rowType === "plan" ? "planDates" : "actualDates";
          const current = new Set(item[field]);
          datesToToggle.forEach((d) => (fill ? current.add(d) : current.delete(d)));
          return { ...item, [field]: Array.from(current) };
        });
        const updated = next.find((i) => i.id === itemId);
        if (updated) scheduleSave(updated);
        return next;
      });
    },
    [scheduleSave]
  );

  return {
    items,
    isLoading,
    error,
    planId,
    targetDate,
    addItem,
    removeItem,
    updateItemName,
    toggleDates,
  };
}
