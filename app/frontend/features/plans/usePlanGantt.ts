/**
 * ガントチャートページ用のデータ管理 hook。
 * - 初回ロード時にユーザーの計画とタスクを API から取得する
 * - 計画がなければデフォルト計画を自動作成する
 * - 変更は debounce してバックグラウンドで API に保存する
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPlan, getPlans } from "@/lib/api/plans";
import { createTask, deleteTask, getTasks, updateTask } from "@/lib/api/tasks";
import type { Plan, Task } from "@/lib/types/plans";
import type { GanttItem } from "@/app/study-plan/page";

/** GanttItem と Task の変換 */
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
  planId: string | null;
  addItem: () => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItemName: (id: string, name: string) => void;
  toggleDates: (
    itemId: string,
    rowType: "plan" | "actual",
    datesToToggle: string[],
    fill: boolean
  ) => void;
};

/** デバウンス保存のウェイト時間（ms） */
const SAVE_DEBOUNCE_MS = 800;

export function usePlanGantt(): UsePlanGanttReturn {
  const [items, setItems] = useState<GanttItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);

  /** タスク情報のキャッシュ（order や status 保持用） */
  const taskCacheRef = useRef<Map<string, Task>>(new Map());

  /** debounce タイマーの管理 */
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /** 初回ロード */
  useEffect(() => {
    (async () => {
      try {
        let plans = await getPlans();

        // 計画がなければデフォルト計画を作成する
        if (plans.length === 0) {
          const today = new Date();
          const targetDate = new Date(today);
          targetDate.setMonth(targetDate.getMonth() + 3);
          const newPlan = await createPlan({
            title: "学習計画",
            description: "",
            target_date: targetDate.toISOString().slice(0, 10),
          });
          plans = [newPlan];
        }

        const plan: Plan = plans[0];
        setPlanId(plan.id);

        const tasks = await getTasks(plan.id);
        tasks.forEach((t) => taskCacheRef.current.set(t.id, t));

        if (tasks.length === 0) {
          // タスクがなければデフォルト項目を作成する
          const defaultNames = [
            "第1章 基礎知識",
            "第2章 重要概念",
            "第3章 応用理論",
            "過去問演習",
            "模擬試験・総復習",
          ];
          const created: GanttItem[] = [];
          for (const name of defaultNames) {
            const task = await createTask(plan.id, { title: name });
            taskCacheRef.current.set(task.id, task);
            created.push(taskToGanttItem(task));
          }
          setItems(created);
        } else {
          setItems(tasks.map(taskToGanttItem));
        }
      } catch {
        // API エラー時はローカルストレージにフォールバック
        const saved = localStorage.getItem("studycoach-gantt-v1");
        if (saved) {
          try {
            setItems(JSON.parse(saved));
          } catch {
            /* 無視 */
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /** タスクを API に保存する（debounce 付き） */
  const scheduleSave = useCallback(
    (item: GanttItem) => {
      if (!planId) return;

      // 既存のタイマーをキャンセル
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
          /* 保存失敗は無視（次の変更時に再試行） */
        }
      }, SAVE_DEBOUNCE_MS);

      saveTimersRef.current.set(item.id, timer);
    },
    [planId]
  );

  const addItem = useCallback(async () => {
    if (!planId) return;
    const task = await createTask(planId, { title: "新しい項目" });
    taskCacheRef.current.set(task.id, task);
    setItems((prev) => [...prev, taskToGanttItem(task)]);
  }, [planId]);

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
    (
      itemId: string,
      rowType: "plan" | "actual",
      datesToToggle: string[],
      fill: boolean
    ) => {
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

  return { items, isLoading, planId, addItem, removeItem, updateItemName, toggleDates };
}
