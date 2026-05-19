# 03. フロントエンド設計書 (Next.js 15)

## 1. ディレクトリ構成

```
app/frontend/
├── middleware.ts                # ルート保護 (Edge)
├── next.config.ts
├── jest.config.ts
├── jest.setup.ts
├── tsconfig.json
├── package.json
├── app/                         # App Router
│   ├── layout.tsx               # ルートレイアウト
│   ├── page.tsx                 # ホーム (ランディング)
│   ├── (auth)/                  # 認証グループ (共通レイアウト)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx    # WIP
│   │   └── callback/page.tsx
│   ├── dashboard/page.tsx
│   ├── plans/page.tsx
│   ├── study-plan/
│   │   ├── page.tsx
│   │   └── components/
│   │       └── GanttChart.tsx
│   ├── sessions/page.tsx
│   ├── admin/page.tsx
│   └── components/              # ランディング + ヘッダー類
│       ├── Navbar.tsx
│       ├── DashboardHeader.tsx
│       ├── Hero.tsx
│       ├── Features.tsx
│       ├── HowItWorks.tsx
│       ├── TargetSection.tsx
│       ├── CampaignSection.tsx
│       ├── CTASection.tsx
│       └── Footer.tsx
├── features/                    # 機能単位のカスタムフック
│   ├── auth/
│   │   ├── useAuth.ts
│   │   └── __tests__/useAuth.test.ts
│   └── plans/
│       └── usePlanGantt.ts
└── lib/
    ├── api/                     # API クライアント
    │   ├── client.ts
    │   ├── auth.ts
    │   ├── plans.ts
    │   ├── tasks.ts
    │   ├── sessions.ts
    │   └── admin.ts
    ├── auth/
    │   └── cognito.ts           # Cognito PKCE / トークン管理
    ├── types/                   # TypeScript 型一元管理
    │   ├── auth.ts
    │   ├── plans.ts
    │   ├── sessions.ts
    │   └── admin.ts
    └── __tests__/client.test.ts
```

---

## 2. ルーティングと画面一覧

### 2.1 認可マトリクス

| パス | 用途 | 認証 | 権限 |
|---|---|---|---|
| `/` | ランディング | 不要 | — |
| `/login` | Cognito ログイン開始 | 不要 (ログイン済みは `/dashboard` へ) | — |
| `/register` | ユーザー登録 (WIP) | 不要 | — |
| `/callback` | Cognito からのコード交換 | 不要 | — |
| `/dashboard` | ハブ画面 | 必要 | — |
| `/plans` | 学習計画一覧 / 作成 / 削除 | 必要 | — |
| `/study-plan` | ガントチャートで計画日付・実績日付管理 | 必要 | — |
| `/sessions` | 1on1 セッション管理 | 必要 | — |
| `/admin` | 管理画面 | 必要 | `is_staff=true` のみ。それ以外は `/dashboard` へリダイレクト |

### 2.2 ページごとの責務

#### `/` (`app/page.tsx`)

ランディングページ。`Navbar` + `Hero` + `Features` + `HowItWorks` + `TargetSection` + `CampaignSection` + `CTASection` + `Footer` のコンポジション。

#### `/(auth)/login` (`app/(auth)/login/page.tsx`)

`useAuth().loginWithCognito()` を呼び、`initiateLogin()` 経由で Cognito Hosted UI へリダイレクト。

#### `/(auth)/register` (WIP)

`useAuth().register()` を呼ぶフォームを持つが、`useAuth` 側に `register` 実装がない。Cognito Hosted UI でのサインアップを正とする方針であれば、ページごと削除/再設計を検討。

#### `/(auth)/callback`

Cognito からのリダイレクト受信用。以下を順に実行:

1. URL パラメータから `code` / `state` を取得
2. `sessionStorage` に保存した `state` と一致するか検証 (CSRF 対策)
3. `exchangeCodeForTokens(code)` で `id_token` / `refresh_token` を取得
4. `saveTokens()` で Cookie に保存
5. `/dashboard` へ遷移

#### `/dashboard`

`DashboardHeader` + 3 つのナビゲーションカード (学習計画 / プラン一覧 / 1on1 セッション)。

#### `/plans`

- `getPlans()` で一覧取得
- 折りたたみ可能なフォームで `createPlan()`
- 行ごとの削除ボタンで `deletePlan(planId)` (確認ダイアログ)
- 各プランから `/study-plan` への導線

#### `/study-plan`

ガントチャート画面。`usePlanGantt()` から:

| 状態 | 説明 |
|---|---|
| `items` | `GanttItem[]` |
| `isLoading` | 初期ロード中 |
| `addItem` / `removeItem` | タスクの追加 / 削除 |
| `updateItemName(id, name)` | 項目名変更 (debounce 保存) |
| `toggleDates(itemId, rowType, dates, fill)` | 計画 / 実績日付の塗りつぶし or 消去 |

ローカル状態として `viewStart` (表示開始日 = 今週月曜)、`totalDays` (8 週間 = 56 日)、`mounted` (SSR ハイドレーション対策)、月単位の折りたたみ集合などを保持。

#### `/sessions`

- `getSessions()` で一覧取得
- 予約フォームで `createSession({ scheduled_at, memo })`
- 削除ボタンで `deleteSession(sessionId)` (完了済みはバックエンド側で 400)

#### `/admin`

`useAuth()` の結果を見て以下を実施:

| 状態 | 動作 |
|---|---|
| `!user` | `/login` へリダイレクト |
| `user && !user.is_staff` | `/dashboard` へリダイレクト |
| `user && user.is_staff` | `getAdminStats()` / `getAdminUsers()` を並行取得 |

UI:
- サマリーカード (総ユーザー / 新規 / 総プラン / タスク完了率)
- ステータス内訳 (プログレスバー)
- ユーザーテーブル (登録日 / プラン数 / タスク完了率 / ステータス)

---

## 3. 共有コンポーネント (`app/components/`)

| コンポーネント | 用途 | 主な特徴 |
|---|---|---|
| `Navbar` | ランディング / 認証ページ用ヘッダー | 固定配置、`menuOpen` ローカル状態でモバイルメニュー切替、CTA に「ログイン」「新規登録」 |
| `DashboardHeader` | 認証済みページ用ヘッダー | `useAuth().user`, `useAuth().logout()` を利用。ログアウト後 `/login` へ |
| `Hero` | ランディング上部 | ガントチャートモック + 桜のアニメ装飾 |
| `Features` / `HowItWorks` / `TargetSection` / `CampaignSection` / `CTASection` / `Footer` | ランディング構成要素 | ステートレス |

---

## 4. カスタムフック (`features/`)

### 4.1 `useAuth` (`features/auth/useAuth.ts`)

```ts
type AuthState = {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type UseAuthReturn = AuthState & {
  loginWithCognito: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
};

export function useAuth(): UseAuthReturn;
```

初期化フロー:

1. Cookie の `id_token` を `getIdToken()` で取得
2. なければ `isAuthenticated=false`
3. あれば `getMe()` を呼んで `user` を取得
4. `getMe()` が 401 等で失敗した場合 `refreshIdToken()` でリトライ
5. リトライも失敗したら `clearTokens()` して未認証状態

> **WIP**: `register/page.tsx` から `useAuth().register()` を呼んでいるが未実装。

### 4.2 `usePlanGantt` (`features/plans/usePlanGantt.ts`)

```ts
type GanttItem = {
  id: string;
  name: string;
  planDates: string[];   // "YYYY-MM-DD"
  actualDates: string[];
};

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
    fill: boolean,
  ) => void;
};
```

初期化フロー:

1. `getPlans()` で計画一覧を取得
2. 計画が 1 件もなければデフォルト計画を `createPlan()` で自動作成
3. `getTasks(planId)` でタスク一覧を取得
4. タスクがなければデフォルトの 5 行を自動作成

主要な保存戦略:
- 変更は **800ms の debounce** で `updateTask()` を呼び出し
- `taskCacheRef` に `{ order, status, title, ... }` をキャッシュ、差分送信に利用
- `saveTimersRef` で debounce タイマー管理
- API エラー時は `localStorage` にフォールバック保存

---

## 5. API クライアント (`lib/api/`)

### 5.1 `client.ts` (基盤)

```ts
type RequestOptions = {
  method?: string;       // default "GET"
  body?: unknown;
  requiresAuth?: boolean; // default false
};

export async function apiRequest<T>(path: string, options?: RequestOptions): Promise<T>;
```

- ベース URL は `process.env.NEXT_PUBLIC_API_BASE_URL` (デフォルト `http://localhost:8000`)
- Cookie から `id_token` を取り出して `Authorization: Bearer <token>` を付与
- レスポンス JSON を返す。`!response.ok` の場合は data を `throw`

```ts
function getAccessToken(): string | null {
  const match = document.cookie.match(/(?:^|; )id_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
```

### 5.2 各モジュール

| モジュール | 関数 | エンドポイント |
|---|---|---|
| `auth.ts` | `getMe()` | GET `/api/v1/auth/me/` |
| `plans.ts` | `getPlans()` / `createPlan(data)` / `getPlan(id)` / `updatePlan(id, data)` / `deletePlan(id)` | `/api/v1/plans/` |
| `tasks.ts` | `getTasks(planId)` / `createTask(planId, data)` / `updateTask(planId, taskId, data)` / `deleteTask(planId, taskId)` | `/api/v1/plans/{planId}/tasks/` |
| `sessions.ts` | `getSessions()` / `createSession(data)` / `updateSession(id, data)` / `deleteSession(id)` | `/api/v1/sessions/` |
| `admin.ts` | `getAdminStats()` / `getAdminUsers()` | `/api/v1/admin/...` |

全関数で `requiresAuth: true` を指定。詳細リクエスト/レスポンスは [04-api-spec.md](./04-api-spec.md) を参照。

---

## 6. Cognito 連携 (`lib/auth/cognito.ts`)

### 6.1 環境変数

```
NEXT_PUBLIC_COGNITO_DOMAIN        # Cognito Hosted UI のドメイン
NEXT_PUBLIC_COGNITO_CLIENT_ID     # App Client ID (Public, PKCE 必須)
NEXT_PUBLIC_COGNITO_REDIRECT_URI  # /callback の絶対 URL
NEXT_PUBLIC_COGNITO_LOGOUT_URI    # ログアウト後の遷移先 URL
```

### 6.2 主要関数

```ts
// PKCE 補助
function generateRandomString(length: number): string;
async function sha256(plain: string): Promise<ArrayBuffer>;
function base64urlEncode(buffer: ArrayBuffer): string;

// トークン Cookie 管理
export function saveTokens(tokens: CognitoTokens): void;  // id_token: 1日, refresh_token: 30日
export function clearTokens(): void;
export function getIdToken(): string | null;
export function getRefreshToken(): string | null;

// OAuth フロー
export async function initiateLogin(): Promise<void>;
export async function exchangeCodeForTokens(code: string): Promise<CognitoTokens>;
export async function refreshIdToken(): Promise<CognitoTokens | null>;
export async function cognitoLogout(): Promise<void>;
```

Cookie 属性: `path=/; SameSite=Strict; Secure (HTTPS 時)`

詳細フローは [06-auth-flow.md](./06-auth-flow.md) を参照。

---

## 7. 型定義 (`lib/types/`)

### 7.1 auth

```ts
type UserResponse = {
  id: string;          // UUID
  email: string;
  username: string;
  is_staff: boolean;
  created_at: string;  // ISO 8601
};

type ApiError = {
  error: {
    code: string;
    message: string | Record<string, string[]>;
  };
};
```

### 7.2 plans / tasks

```ts
type PlanStatus = "active" | "completed" | "archived";
type TaskStatus = "pending" | "in_progress" | "completed";

type Plan = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_date: string;
  status: PlanStatus;
  created_at: string;
  updated_at: string;
};

type Task = {
  id: string;
  plan_id: string;
  title: string;
  description: string;
  plan_dates: string[];
  actual_dates: string[];
  start_date: string | null;
  end_date: string | null;
  status: TaskStatus;
  order: number;
  created_at: string;
  updated_at: string;
};
```

### 7.3 sessions

```ts
type SessionStatus = "scheduled" | "completed" | "cancelled";

type Session = {
  id: string;
  user_id: string;
  scheduled_at: string;
  memo: string;
  summary: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
};
```

### 7.4 admin

```ts
type AdminStats = {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  total_plans: number;
  plans_by_status: { active: number; completed: number; archived: number };
  total_tasks: number;
  tasks_by_status: { pending: number; in_progress: number; completed: number };
};

type AdminUser = {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
  plan_count: number;
  completed_plan_count: number;
  task_count: number;
  completed_task_count: number;
};
```

---

## 8. ミドルウェア (`middleware.ts`)

Edge ランタイムで動作するルート保護。

| 入力 | 動作 |
|---|---|
| `request.cookies.get("id_token")` が存在 | 認証済みとみなす |

```
保護対象: /dashboard, /plans, /study-plan, /sessions, /admin
公開:     /, /login, /register, /callback
```

- **保護対象 × 未認証**: `/login?next=<元のパス>` へリダイレクト
- **認証専用 (`/login`, `/register`) × 認証済み**: `/dashboard` へリダイレクト (重複ログイン防止)

> Cookie のみで判定するため、トークン署名検証はバックエンド (DRF の `CognitoJWTAuthentication`) で実施。フロントエンドの middleware は粗いフィルタリングと考える。

---

## 9. ガントチャート (`app/study-plan/components/GanttChart.tsx`)

### 9.1 Props

```ts
type Props = {
  items: GanttItem[];
  dates: Date[];
  onToggleDates: (
    itemId: string,
    rowType: "plan" | "actual",
    dates: string[],
    fill: boolean,
  ) => void;
  onUpdateName: (id: string, name: string) => void;
  onRemoveItem: (id: string) => void;
};
```

### 9.2 レイアウト構成

HTML `<table>` ベースで実装 (外部ガントチャートライブラリ不使用)。

- 4 段ヘッダー:
  1. 年ラベル (年が変わる位置のみ)
  2. 月ラベル (折りたたみボタン付き)
  3. 曜日 (展開中の月のみ)
  4. 日付 (展開中の月のみ)
- 左固定列: 項目名 (rowSpan=2 で計画行・実績行をまたぐ)
- 本体: 1 項目につき 2 行 (計画行 + 実績行)

### 9.3 セルサイズ

```ts
const NAME_COL_WIDTH = 210;
const CELL_WIDTH = 30;
const COLLAPSED_CELL_WIDTH = 22;
```

### 9.4 月の折りたたみ / 展開

```ts
function toggleMonth(key: string, e: React.MouseEvent): void;  // key="YYYY-MM"
function isCollapsed(key: string): boolean;
```

折りたたまれた月は曜日 / 日付行を表示せず、列幅を `COLLAPSED_CELL_WIDTH` に詰める。

### 9.5 ドラッグ塗りつぶし

```ts
type DragState = {
  itemId: string;
  rowType: "plan" | "actual";
  fill: boolean;        // mousedown 時点の状態の逆 (= 塗る/消す)
  startDate: string;
  lastDate: string;
};
```

`mouseup` 時に塗る / 消す日付を **差分計算** して 1 回だけ `onToggleDates` を呼ぶ:

```ts
const prevSet = new Set(getDatesBetween(startDate, lastDate));
const nextSet = new Set(getDatesBetween(startDate, newDate));
const toApply = [...nextSet].filter(d => !prevSet.has(d)); // 追加
const toUndo  = [...prevSet].filter(d => !nextSet.has(d)); // 取り消し
```

### 9.6 スタイリング (Tailwind)

| 状態 | 計画行 | 実績行 |
|---|---|---|
| 塗りつぶし | `bg-indigo-500` | `bg-emerald-500` |
| 今日 | `bg-indigo-50` | `bg-emerald-50` |
| 土日 | `bg-gray-50` | `bg-gray-50` |
| 平日 hover | `hover:bg-indigo-100` | `hover:bg-emerald-100` |

セル属性で識別:

```html
<td data-gantt="true" data-item-id={id} data-row-type="plan" data-date="YYYY-MM-DD" />
```

---

## 10. テスト

### 10.1 設定 (`jest.config.ts`)

```ts
{
  testEnvironment: "jsdom",
  setupFilesAfterEach: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }] },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
}
```

`jest.setup.ts` で `@testing-library/jest-dom` をロード。

### 10.2 既存テスト

- `features/auth/__tests__/useAuth.test.ts`
  - id_token なし → 未認証
  - id_token あり → ユーザー設定
  - `getMe()` 失敗 + リフレッシュ成功 → 認証
  - 両方失敗 → 未認証
  - `loginWithCognito` → `initiateLogin()` 呼び出し
  - `logout` → `cognitoLogout()` 呼び出し
- `lib/__tests__/client.test.ts`
  - GET / POST 正常
  - `requiresAuth` で Authorization ヘッダー切替
  - `!ok` → throw

---

## 11. 環境変数 (`.env.local`)

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_COGNITO_DOMAIN=https://<your-domain>.auth.ap-northeast-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000
```
