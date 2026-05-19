# 04. REST API 仕様書

## 1. 共通事項

### 1.1 ベース URL

| 環境 | URL |
|---|---|
| 開発 | `http://localhost:8000` |
| 本番 | `https://<your-domain>` |

すべての API はプレフィックス `/api/v1/` 配下に配置されます。

### 1.2 認証

- 認証は **Cognito の id_token** を Bearer 形式で送信
- `Authorization: Bearer <id_token>`
- DRF の `CognitoJWTAuthentication` が JWKS で署名検証 (TTL 1 時間でキャッシュ)
- Cognito グループ `coaches` 所属ユーザーは `is_staff=True` として同期

### 1.3 レート制限 (DRF Throttle)

| 区分 | 上限 |
|---|---|
| 未認証 (`anon`) | 20 リクエスト / 分 |
| 認証済み (`user`) | 100 リクエスト / 分 |

### 1.4 エラーレスポンス

```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | BAD_REQUEST | ...",
    "message": "人間可読なメッセージ"
  }
}
```

| HTTP | 用途 |
|---|---|
| 400 | バリデーション失敗 / ビジネスルール違反 |
| 401 | 認証失敗 / トークン期限切れ |
| 403 | DRF 標準 (権限 View) ※サービスの多くは漏洩防止のため 404 |
| 404 | 不在 / 権限なし (区別しない方針) |

---

## 2. 認証 / ユーザー API

### 2.1 GET `/api/v1/auth/me/`

ログイン中ユーザー情報を取得します。

**認証**: 必須

**レスポンス 200**

```json
{
  "id": "8e2c…uuid",
  "email": "user@example.com",
  "username": "Taro Yamada",
  "is_staff": false,
  "created_at": "2026-04-15T10:30:00Z"
}
```

### 2.2 POST `/api/v1/auth/coaches/`

コーチアカウントを Cognito 上に作成し、`coaches` グループに追加します。

**認証**: 必須 / **権限**: `is_staff=True`

**リクエスト**

```json
{ "email": "coach@example.com" }
```

**レスポンス 201**: 本文なし
**監査ログ**: `audit` ロガーに「コーチ作成: 実行者=… 対象メール=…」を INFO 出力

**主なエラー**

| HTTP | code | message |
|---|---|---|
| 400 | `VALIDATION_ERROR` | メールアドレスの形式が不正 |
| 400 | `BAD_REQUEST` | 既に Cognito に同一メールが存在する |
| 400 | `BAD_REQUEST` | `coaches` グループへの追加に失敗 |

---

## 3. 学習計画 API

### 3.1 GET `/api/v1/plans/`

ログイン中ユーザーが所有する計画一覧を `created_at` 降順で返します。

**レスポンス 200**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "簿記2級合格プラン",
    "description": "毎日2時間",
    "target_date": "2026-11-15",
    "status": "active",
    "created_at": "2026-05-01T09:00:00Z",
    "updated_at": "2026-05-10T08:30:00Z"
  }
]
```

### 3.2 POST `/api/v1/plans/`

新規計画を作成します。

**リクエスト**

```json
{
  "title": "簿記2級合格プラン",
  "description": "毎日2時間",
  "target_date": "2026-11-15"
}
```

| フィールド | 型 | 必須 | 備考 |
|---|---|---|---|
| `title` | string (1-255) | ✓ | |
| `description` | string | | 既定: 空文字 |
| `target_date` | string (YYYY-MM-DD) | ✓ | |

**レスポンス 201**: Plan オブジェクト

### 3.3 GET `/api/v1/plans/{plan_id}/`

計画詳細。`plan_id` の所有者でない場合は **404** を返す。

### 3.4 PUT `/api/v1/plans/{plan_id}/`

計画を更新。

**リクエスト**

```json
{
  "title": "...",
  "description": "...",
  "target_date": "YYYY-MM-DD",
  "status": "active | completed | archived"
}
```

### 3.5 DELETE `/api/v1/plans/{plan_id}/`

計画削除。配下のタスクは `CASCADE` で同時削除されます。

**レスポンス 204**

---

## 4. タスク API

タスクはガントチャートの「行」に相当します。

### 4.1 GET `/api/v1/plans/{plan_id}/tasks/`

タスク一覧を `order` 昇順で返します。`plan_id` の所有者でない場合は 404。

**レスポンス 200**

```json
[
  {
    "id": "uuid",
    "plan_id": "uuid",
    "title": "第1章 基礎",
    "description": "",
    "plan_dates": ["2026-05-01", "2026-05-02", "2026-05-03"],
    "actual_dates": ["2026-05-01"],
    "start_date": "2026-05-01",
    "end_date": "2026-05-03",
    "status": "in_progress",
    "order": 1,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### 4.2 POST `/api/v1/plans/{plan_id}/tasks/`

新規タスクを作成。`order` は `count_by_plan_id() + 1` で自動採番。

**リクエスト**

```json
{
  "title": "第1章 基礎",
  "description": "",
  "plan_dates": ["2026-05-01", "2026-05-02"],
  "actual_dates": [],
  "start_date": null,
  "end_date": null
}
```

| フィールド | 型 | 必須 | 備考 |
|---|---|---|---|
| `title` | string (1-255) | ✓ | |
| `description` | string | | 既定: 空文字 |
| `plan_dates` | string[] (YYYY-MM-DD) | | 既定: `[]` |
| `actual_dates` | string[] (YYYY-MM-DD) | | 既定: `[]` |
| `start_date` | string\|null | | `plan_dates` から自動導出可能 |
| `end_date` | string\|null | | 同上 |

**バリデーション**:
- `plan_dates` / `actual_dates` の各要素は `YYYY-MM-DD` 形式 (`DateStringField`)
- 不正形式は 400 `VALIDATION_ERROR`

### 4.3 GET `/api/v1/plans/{plan_id}/tasks/{task_id}/`

タスク詳細。`task_id` が指定 `plan_id` 配下でない場合は 404。

### 4.4 PUT `/api/v1/plans/{plan_id}/tasks/{task_id}/`

タスク更新。

**リクエスト**

```json
{
  "title": "第1章 基礎",
  "description": "",
  "plan_dates": ["2026-05-01"],
  "actual_dates": ["2026-05-01"],
  "status": "pending | in_progress | completed",
  "order": 1,
  "start_date": null,
  "end_date": null
}
```

`start_date` / `end_date` 未指定時は `plan_dates` の最小・最大から導出されます。

### 4.5 DELETE `/api/v1/plans/{plan_id}/tasks/{task_id}/`

タスク削除。**204**。

---

## 5. 1on1 セッション API

### 5.1 GET `/api/v1/sessions/`

ログイン中ユーザーのセッション一覧を `scheduled_at` 降順で返します。

**レスポンス 200**

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "scheduled_at": "2026-05-25T19:00:00+09:00",
    "memo": "進捗確認したい",
    "summary": "",
    "status": "scheduled",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### 5.2 POST `/api/v1/sessions/`

新規セッションを予約。

**リクエスト**

```json
{
  "scheduled_at": "2026-05-25T19:00:00+09:00",
  "memo": "進捗確認したい"
}
```

| フィールド | 型 | 必須 |
|---|---|---|
| `scheduled_at` | ISO 8601 datetime | ✓ |
| `memo` | string | (default `""`) |

ステータスは自動的に `scheduled` に設定。

### 5.3 GET `/api/v1/sessions/{session_id}/`

セッション詳細。所有者でない場合は 404。

### 5.4 PUT `/api/v1/sessions/{session_id}/`

セッション更新。

**リクエスト**

```json
{
  "scheduled_at": "2026-05-26T19:00:00+09:00",
  "memo": "...",
  "summary": "前回のまとめ",
  "status": "scheduled | completed | cancelled"
}
```

**ビジネスルール**:
- **status が `completed` のセッションは `scheduled_at` を変更不可** → 違反時 400 `BAD_REQUEST`

### 5.5 DELETE `/api/v1/sessions/{session_id}/`

セッション削除。

**ビジネスルール**:
- **status が `completed` のセッションは削除不可** → 違反時 400 `BAD_REQUEST`

---

## 6. 管理 API

すべて `IsAdminUser` (`is_staff=True`) 必須。`audit` ロガーに `email` / IP を記録。

### 6.1 GET `/api/v1/admin/stats/`

サービス全体の集計。

**レスポンス 200**

```json
{
  "total_users": 150,
  "active_users": 45,
  "new_users_this_month": 12,
  "total_plans": 120,
  "plans_by_status": { "active": 80, "completed": 30, "archived": 10 },
  "total_tasks": 850,
  "tasks_by_status": { "pending": 200, "in_progress": 400, "completed": 250 }
}
```

集計仕様:
- `active_users`: 1 件以上計画を持つユーザー数
- `new_users_this_month`: 当月初日 00:00 JST 以降に作成されたユーザー数

### 6.2 GET `/api/v1/admin/users/`

ユーザー一覧と利用状況。`created_at` 降順。

**レスポンス 200**

```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "username": "Taro",
    "is_active": true,
    "is_staff": false,
    "created_at": "2026-04-15T10:30:00Z",
    "plan_count": 3,
    "completed_plan_count": 1,
    "task_count": 15,
    "completed_task_count": 5
  }
]
```

---

## 7. エンドポイント一覧

```
GET    /api/v1/auth/me/
POST   /api/v1/auth/coaches/                                      [is_staff]

GET    /api/v1/plans/
POST   /api/v1/plans/
GET    /api/v1/plans/{plan_id}/
PUT    /api/v1/plans/{plan_id}/
DELETE /api/v1/plans/{plan_id}/

GET    /api/v1/plans/{plan_id}/tasks/
POST   /api/v1/plans/{plan_id}/tasks/
GET    /api/v1/plans/{plan_id}/tasks/{task_id}/
PUT    /api/v1/plans/{plan_id}/tasks/{task_id}/
DELETE /api/v1/plans/{plan_id}/tasks/{task_id}/

GET    /api/v1/sessions/
POST   /api/v1/sessions/
GET    /api/v1/sessions/{session_id}/
PUT    /api/v1/sessions/{session_id}/
DELETE /api/v1/sessions/{session_id}/

GET    /api/v1/admin/stats/                                       [is_staff]
GET    /api/v1/admin/users/                                       [is_staff]
```
