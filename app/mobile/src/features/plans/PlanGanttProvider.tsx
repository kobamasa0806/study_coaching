/**
 * ガントチャート(usePlanGantt)と勉強記録(useStudyLogs)の状態を1箇所にまとめ、
 * タブ画面(plan.tsx)とモーダル画面(study-log-modal.tsx)など別ルート間で共有する。
 * Expo Routerではルートごとにコンポーネントツリーが分かれるため、Web版のように
 * 同一ページ内でstateを直接共有できない代わりに、この共有Contextを介して
 * 「記録を追加したら即座にガントチャートの実績セルに反映される」というWeb版と
 * 同じ挙動を実現する。
 */
import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { usePlanGantt } from "./usePlanGantt";
import { useStudyLogs } from "@/features/studyLogs/useStudyLogs";

type PlanGanttContextValue = {
  gantt: ReturnType<typeof usePlanGantt>;
  studyLogs: ReturnType<typeof useStudyLogs>;
};

const PlanGanttContext = createContext<PlanGanttContextValue | null>(null);

export function PlanGanttProvider({ children }: { children: ReactNode }) {
  const gantt = usePlanGantt();
  const { toggleDates } = gantt;

  const toggleActualDate = useCallback(
    (taskId: string, date: string, fill: boolean) => toggleDates(taskId, "actual", [date], fill),
    [toggleDates]
  );

  const studyLogs = useStudyLogs(gantt.planId, toggleActualDate);

  const value = useMemo(() => ({ gantt, studyLogs }), [gantt, studyLogs]);

  return <PlanGanttContext.Provider value={value}>{children}</PlanGanttContext.Provider>;
}

export function usePlanGanttContext(): PlanGanttContextValue {
  const ctx = useContext(PlanGanttContext);
  if (!ctx) {
    throw new Error("usePlanGanttContext は PlanGanttProvider の内側で使用してください。");
  }
  return ctx;
}
