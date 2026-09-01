/**
 * 勉強記録ページ用のデータ管理 hook。
 * - 指定された計画の勉強記録一覧と集計を API から取得する
 * - 記録の追加・削除を行い、その都度集計を再取得する
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createStudyLog,
  deleteStudyLog,
  getStudyLogStats,
  getStudyLogs,
} from "@/lib/api/studyLogs";
import type {
  CreateStudyLogRequest,
  StudyLog,
  StudyLogStats,
} from "@/lib/types/studyLogs";

/** 集計の初期値（記録ゼロの状態） */
const EMPTY_STATS: StudyLogStats = {
  total_minutes: 0,
  log_count: 0,
  hourly_minutes: Array.from({ length: 24 }, () => 0),
};

type UseStudyLogsReturn = {
  logs: StudyLog[];
  stats: StudyLogStats;
  isLoading: boolean;
  /** 記録を追加する。成功時 true、失敗時はエラーメッセージを返す */
  addLog: (data: CreateStudyLogRequest) => Promise<true | string>;
  removeLog: (logId: string) => Promise<void>;
};

/**
 * @param planId 対象の計画 ID。null の間はロードしない
 * @param toggleActualDate 指定タスク・日付のガントチャート実績セルを塗る/消す関数。
 *   記録の追加時に塗り、削除時は同じタスク・日付の記録が他になければ消す。
 */
export function useStudyLogs(
  planId: string | null,
  toggleActualDate?: (taskId: string, date: string, fill: boolean) => void
): UseStudyLogsReturn {
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [stats, setStats] = useState<StudyLogStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // 最新の planId を参照するための ref（コールバック内で使う）
  const planIdRef = useRef<string | null>(planId);
  planIdRef.current = planId;

  /** 一覧と集計をまとめて取得する */
  const refresh = useCallback(async (id: string): Promise<StudyLog[]> => {
    const [fetchedLogs, fetchedStats] = await Promise.all([
      getStudyLogs(id),
      getStudyLogStats(id),
    ]);
    setLogs(fetchedLogs);
    setStats(fetchedStats);
    return fetchedLogs;
  }, []);

  /** 初回・planId 変更時のロード */
  useEffect(() => {
    if (!planId) return;

    let ignore = false;
    setIsLoading(true);
    (async () => {
      try {
        const [fetchedLogs, fetchedStats] = await Promise.all([
          getStudyLogs(planId),
          getStudyLogStats(planId),
        ]);
        if (ignore) return;
        setLogs(fetchedLogs);
        setStats(fetchedStats);
      } catch {
        if (ignore) return;
        // 取得失敗時は空表示にフォールバックする
        setLogs([]);
        setStats(EMPTY_STATS);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [planId]);

  const addLog = useCallback(
    async (data: CreateStudyLogRequest): Promise<true | string> => {
      const id = planIdRef.current;
      if (!id) return "計画が読み込まれていません。";
      try {
        await createStudyLog(id, data);
        await refresh(id);
        toggleActualDate?.(data.task_id, data.studied_on, true);
        return true;
      } catch (e) {
        // バックエンドのエラー形式 { error: { message } } を読み取る
        const message =
          typeof e === "object" && e !== null && "error" in e
            ? String((e as { error?: { message?: unknown } }).error?.message ?? "")
            : "";
        return message || "記録の保存に失敗しました。";
      }
    },
    [refresh, toggleActualDate]
  );

  const removeLog = useCallback(
    async (logId: string): Promise<void> => {
      const id = planIdRef.current;
      if (!id) return;
      const target = logs.find((l) => l.id === logId);
      await deleteStudyLog(id, logId);
      const fetchedLogs = await refresh(id);

      // 同じタスク・日付の記録が他に残っていなければ、実績セルも消す
      if (target && toggleActualDate) {
        const stillExists = fetchedLogs.some(
          (l) => l.task_id === target.task_id && l.studied_on === target.studied_on
        );
        if (!stillExists) {
          toggleActualDate(target.task_id, target.studied_on, false);
        }
      }
    },
    [logs, refresh, toggleActualDate]
  );

  return { logs, stats, isLoading, addLog, removeLog };
}
