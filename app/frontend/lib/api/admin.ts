/**
 * 管理画面 API クライアント。
 * is_staff=true のユーザーのみ呼び出し可能。
 */

import { apiRequest } from "./client";
import type { AdminStats, AdminUser } from "@/lib/types/admin";

export async function getAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/api/v1/admin/stats/", { requiresAuth: true });
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/api/v1/admin/users/", { requiresAuth: true });
}
