# 05. データモデル設計書

## 1. ER 図

```
+----------------+         1 : N         +----------------+        1 : N        +----------------+
|     users      |---------------------->|     plans      |-------------------->|     tasks      |
+----------------+                       +----------------+                     +----------------+
| id (PK, UUID)  |                       | id (PK, UUID)  |                     | id (PK, UUID)  |
| email (UNIQUE) |                       | user_id (FK)   |                     | plan_id (FK)   |
| username       |                       | title          |                     | title          |
| password       |                       | description    |                     | description    |
| is_active      |                       | target_date    |                     | start_date     |
| is_staff       |                       | status         |                     | end_date       |
| is_superuser   |                       | created_at     |                     | plan_dates     |
| created_at     |                       | updated_at     |                     | actual_dates   |
| last_login     |                       +----------------+                     | status         |
+----------------+                                                              | order          |
        |                                                                       | created_at     |
        |                                                                       | updated_at     |
        |                       1 : N                                           +----------------+
        +----------------------------+
                                     |
                                     v
                              +----------------+
                              |    sessions    |
                              +----------------+
                              | id (PK, UUID)  |
                              | user_id (FK)   |
                              | scheduled_at   |
                              | memo           |
                              | summary        |
                              | status         |
                              | created_at     |
                              | updated_at     |
                              +----------------+
```

### 1.1 関連サマリー

| 親 | 子 | カーディナリティ | 削除動作 |
|---|---|---|---|
| users | plans | 1 : N | ON DELETE CASCADE |
| plans | tasks | 1 : N | ON DELETE CASCADE |
| users | sessions | 1 : N | ON DELETE CASCADE |

---

## 2. テーブル定義

### 2.1 users (`UserModel`)

| カラム | 型 | NULL | デフォルト | 制約 / 備考 |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `uuid4()` | PRIMARY KEY |
| `email` | VARCHAR(254) | NOT NULL | — | **UNIQUE**, ログイン ID |
| `username` | VARCHAR(150) | NOT NULL | — | 表示名 |
| `password` | VARCHAR(128) | NOT NULL | — | Django ハッシュ。Cognito 認証時はダミー (`set_unusable_password`) のケースもあり |
| `is_active` | BOOLEAN | NOT NULL | TRUE | |
| `is_staff` | BOOLEAN | NOT NULL | FALSE | Cognito `coaches` グループから同期 |
| `is_superuser` | BOOLEAN | NOT NULL | FALSE | Django 標準 |
| `created_at` | TIMESTAMP | NOT NULL | `now()` | `auto_now_add` |
| `last_login` | TIMESTAMP | NULL | NULL | Django 標準 |

`USERNAME_FIELD = "email"`, `REQUIRED_FIELDS = ["username"]`

### 2.2 plans (`PlanModel`)

| カラム | 型 | NULL | デフォルト | 制約 / 備考 |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `uuid4()` | PRIMARY KEY |
| `user_id` | UUID | NOT NULL | — | FK → users.id, ON DELETE CASCADE |
| `title` | VARCHAR(255) | NOT NULL | — | |
| `description` | TEXT | NOT NULL | `''` | |
| `target_date` | DATE | NOT NULL | — | 目標達成日 |
| `status` | VARCHAR(20) | NOT NULL | `active` | `active` / `completed` / `archived` |
| `created_at` | TIMESTAMP | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMP | NOT NULL | `now()` | `auto_now` |

**インデックス**:
- 暗黙: PRIMARY KEY (`id`)
- 推奨: `idx_plans_user_id (user_id)`, `idx_plans_created_at (created_at DESC)`

**順序**: `ordering = ["-created_at"]`

### 2.3 tasks (`TaskModel`)

| カラム | 型 | NULL | デフォルト | 制約 / 備考 |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `uuid4()` | PRIMARY KEY |
| `plan_id` | UUID | NOT NULL | — | FK → plans.id, ON DELETE CASCADE |
| `title` | VARCHAR(255) | NOT NULL | — | |
| `description` | TEXT | NOT NULL | `''` | |
| `start_date` | DATE | NULL | NULL | `plan_dates` から自動導出可能 |
| `end_date` | DATE | NULL | NULL | 同上 |
| `plan_dates` | JSONB | NOT NULL | `[]` | `["YYYY-MM-DD", ...]` ガントチャートの青セル |
| `actual_dates` | JSONB | NOT NULL | `[]` | `["YYYY-MM-DD", ...]` ガントチャートの緑セル |
| `status` | VARCHAR(20) | NOT NULL | `pending` | `pending` / `in_progress` / `completed` |
| `order` | INTEGER (≥0) | NOT NULL | 1 | 表示順 |
| `created_at` | TIMESTAMP | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMP | NOT NULL | `now()` | |

**インデックス**:
- PRIMARY KEY (`id`)
- 推奨: `idx_tasks_plan_id (plan_id)`, `idx_tasks_order (plan_id, order)`

**順序**: `ordering = ["order", "start_date"]`

### 2.4 sessions (`SessionModel`)

| カラム | 型 | NULL | デフォルト | 制約 / 備考 |
|---|---|---|---|---|
| `id` | UUID | NOT NULL | `uuid4()` | PRIMARY KEY |
| `user_id` | UUID | NOT NULL | — | FK → users.id, ON DELETE CASCADE |
| `scheduled_at` | TIMESTAMP | NOT NULL | — | UTC で保存、表示時に JST 変換 |
| `memo` | TEXT | NOT NULL | `''` | 事前メモ / アジェンダ |
| `summary` | TEXT | NOT NULL | `''` | 終了後のサマリー |
| `status` | VARCHAR(20) | NOT NULL | `scheduled` | `scheduled` / `completed` / `cancelled` |
| `created_at` | TIMESTAMP | NOT NULL | `now()` | |
| `updated_at` | TIMESTAMP | NOT NULL | `now()` | |

**インデックス**:
- PRIMARY KEY (`id`)
- 推奨: `idx_sessions_user_id (user_id)`, `idx_sessions_scheduled_at (scheduled_at DESC)`

**順序**: `ordering = ["-scheduled_at"]`

---

## 3. ステータス遷移

### 3.1 PlanStatus

```
[ active ]  --完了--> [ completed ]
     |
     +---アーカイブ--> [ archived ]
```

遷移制約はバックエンドでは強制されず、フロントエンド UI 任せ。

### 3.2 TaskStatus

```
[ pending ] --着手--> [ in_progress ] --完了--> [ completed ]
```

`actual_dates` が 1 件以上あれば実質的に `in_progress` 以上の意味を持つが、`status` フィールドとは分離 (UI で操作)。

### 3.3 SessionStatus

```
[ scheduled ]  --実施--> [ completed ] (※ scheduled_at 変更不可 / 削除不可)
     |
     +---キャンセル--> [ cancelled ]
```

**バックエンド強制ルール**:
- `completed` への遷移後は `scheduled_at` 変更不可
- `completed` のレコードは削除不可

---

## 4. JSON 型フィールド設計

### 4.1 `tasks.plan_dates` / `tasks.actual_dates`

```json
["2026-05-01", "2026-05-02", "2026-05-03"]
```

- 要素は `YYYY-MM-DD` 形式の文字列 (DRF `DateStringField` でバリデーション)
- 重複は許容しない (リポジトリで重複除去)
- ソート順序は問わない (フロントエンドで自由に管理)
- ガントチャートの「塗りつぶし」を表現する集合として運用

> **注**: 連続日付ではなくスパース (飛び石) を許容する設計。`start_date` / `end_date` は表示効率化のための導出値。

---

## 5. データ整合性

| 整合性ポイント | 担保箇所 |
|---|---|
| plan の所有者 = 操作者 | `GetStudyPlanUseCase` / View で `user_id` 一致を検証 |
| task の所属プラン = 指定 plan_id | `GetTaskUseCase` で `plan_id` 一致を検証 |
| session の所有者 = 操作者 | `GetSessionUseCase` で `user_id` 一致 |
| `tasks.order` の連番性 | `CreateTaskUseCase` が `count + 1` で採番 (更新時は明示指定) |
| `tasks.start_date` / `end_date` の整合 | `plan_dates` の min / max から自動導出 |
| Cognito 認証ユーザー = ローカル `users` レコード | `CognitoJWTAuthentication._get_or_create_user` |
| Cognito グループ ↔ `is_staff` | `CognitoJWTAuthentication` 内で同期 |

---

## 6. マイグレーション履歴

| アプリ | マイグレーション | 内容 |
|---|---|---|
| users | `0001_initial` | `UserModel` 作成 |
| plans | `0001_initial` | `PlanModel` 作成 |
| tasks | `0001_initial` | `TaskModel` 初期 |
| tasks | `0002_taskmodel_actual_dates_taskmodel_plan_dates_and_more` | `plan_dates` / `actual_dates` を JSONField で追加。`start_date` / `end_date` を NULL 許容に変更 |
| sessions | `0001_initial` | `SessionModel` 作成 |

---

## 7. 物理 DDL (PostgreSQL 例)

```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        VARCHAR(254) NOT NULL UNIQUE,
  username     VARCHAR(150) NOT NULL,
  password     VARCHAR(128) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  is_staff     BOOLEAN NOT NULL DEFAULT FALSE,
  is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login   TIMESTAMPTZ NULL
);

CREATE TABLE plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target_date DATE NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plans_user_id    ON plans(user_id);
CREATE INDEX idx_plans_created_at ON plans(created_at DESC);

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  start_date   DATE NULL,
  end_date     DATE NULL,
  plan_dates   JSONB NOT NULL DEFAULT '[]',
  actual_dates JSONB NOT NULL DEFAULT '[]',
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  "order"      INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_plan_id ON tasks(plan_id);
CREATE INDEX idx_tasks_order   ON tasks(plan_id, "order");

CREATE TABLE sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  memo         TEXT NOT NULL DEFAULT '',
  summary      TEXT NOT NULL DEFAULT '',
  status       VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user_id      ON sessions(user_id);
CREATE INDEX idx_sessions_scheduled_at ON sessions(scheduled_at DESC);
```
