/**
 * タスク API クライアント。
 */

import type { CreateTaskRequest, Task, UpdateTaskRequest } from "../types/plans";
import { apiRequest } from "./client";

/**
 * タスク一覧取得
 * GET /api/v1/plans/{planId}/tasks/
 */
export async function getTasks(planId: string): Promise<Task[]> {
  return apiRequest<Task[]>(`/api/v1/plans/${planId}/tasks/`, { requiresAuth: true });
}

/**
 * タスク作成
 * POST /api/v1/plans/{planId}/tasks/
 */
export async function createTask(planId: string, data: CreateTaskRequest): Promise<Task> {
  return apiRequest<Task>(`/api/v1/plans/${planId}/tasks/`, {
    method: "POST",
    body: data,
    requiresAuth: true,
  });
}

/**
 * タスク更新
 * PUT /api/v1/plans/{planId}/tasks/{taskId}/
 */
export async function updateTask(
  planId: string,
  taskId: string,
  data: UpdateTaskRequest
): Promise<Task> {
  return apiRequest<Task>(`/api/v1/plans/${planId}/tasks/${taskId}/`, {
    method: "PUT",
    body: data,
    requiresAuth: true,
  });
}

/**
 * タスク削除
 * DELETE /api/v1/plans/{planId}/tasks/{taskId}/
 */
export async function deleteTask(planId: string, taskId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/plans/${planId}/tasks/${taskId}/`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
