# CLAUDE.md — study-coaching

## プロジェクト概要

**study-coaching** は、資格取得を目指すユーザーの学習を支援するアプリケーションです。
学習計画の立案・進捗記録をガントチャートで可視化し、管理者（コーチ）との 1on1 を通じて継続的な進捗管理を行います。

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js (App Router)
- **UI ライブラリ**: React
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand または React Query (TanStack Query)
- **ガントチャート**: `react-google-charts` / `dhtmlx-gantt` / `frappe-gantt` など用途に応じて選定
- **フォーム**: React Hook Form + Zod
- **HTTP クライアント**: Axios または fetch (Next.js 標準)
- **レスポンシブ**: モバイルファーストで設計。Tailwind のブレークポイント (`sm` / `md` / `lg`) を活用

### バックエンド
- **フレームワーク**: Django + Django REST Framework (DRF)
- **認証**: JWT 認証 (`djangorestframework-simplejwt`)
- **DB**: PostgreSQL
- **ORM**: Django ORM
- **バリデーション**: DRF Serializer
- **CORS**: `django-cors-headers`

---

## アーキテクチャ方針

### クリーンアーキテクチャ（全体原則）

本プロジェクトは **クリーンアーキテクチャ** を基本思想とします。
依存の方向は常に **外側 → 内側** の一方向を厳守します。

```
Presentation層 → Application層 → Domain層
Infrastructure層 → Application層 / Domain層
```

各層の責務を明確に分離し、ビジネスロジックがフレームワークや DB に依存しない設計を維持してください。

---

### バックエンド構成（Django）

```
backend/
├── config/                  # Django 設定・ルーティング
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/               # ユーザー・認証
│   │   ├── domain/          # エンティティ・値オブジェクト・リポジトリIF
│   │   ├── application/     # ユースケース
│   │   ├── infrastructure/  # Django ORM 実装・外部連携
│   │   └── presentation/    # DRF ViewSet・Serializer・URLs
│   ├── plans/               # 学習計画
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   ├── tasks/               # タスク（ガントチャートの各要素）
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   └── sessions/            # 1on1 セッション管理
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── presentation/
└── shared/                  # 共通基底クラス・例外・ユーティリティ
```

#### 各ディレクトリの責務

| ディレクトリ | 責務 |
|---|---|
| `domain/` | エンティティ、値オブジェクト、リポジトリインターフェース（抽象クラス）。外部依存ゼロ |
| `application/` | ユースケース。ドメインを orchestrate する。DI でリポジトリを受け取る |
| `infrastructure/` | Django ORM を使ったリポジトリ実装、外部 API アダプター |
| `presentation/` | DRF の ViewSet / APIView、Serializer、URL ルーティング |

**ルール:**
- `domain/` は Django・DRF を一切 import しない
- `application/` は `presentation/` を import しない
- Serializer はデータの変換のみ担当し、ビジネスロジックを持たない
- ビジネスロジックは必ず `domain/` または `application/` に記述する

---

### フロントエンド構成（Next.js）

```
frontend/
├── app/                     # App Router ページ
│   ├── (auth)/              # 認証関連ページ
│   ├── dashboard/           # ダッシュボード
│   ├── plans/               # 学習計画一覧・詳細
│   ├── gantt/               # ガントチャート表示・編集
│   └── sessions/            # 1on1 セッション
├── components/
│   ├── ui/                  # 汎用 UI コンポーネント（Button, Modal 等）
│   ├── gantt/               # ガントチャート関連コンポーネント
│   ├── plans/               # 学習計画コンポーネント
│   └── sessions/            # セッションコンポーネント
├── features/                # 機能単位のロジック（hooks, stores）
│   ├── auth/
│   ├── plans/
│   ├── gantt/
│   └── sessions/
├── lib/
│   ├── api/                 # API クライアント・エンドポイント定義
│   ├── types/               # TypeScript 型定義
│   └── utils/               # 汎用ユーティリティ
└── public/
```

**ルール:**
- `app/` 配下の Page コンポーネントは薄く保ち、ロジックは `features/` に集約する
- API 通信は必ず `lib/api/` 経由で行い、コンポーネントから直接 fetch しない
- 型定義は `lib/types/` で一元管理し、`any` の使用を禁止する

---

## API 設計

RESTful API として設計します。ベース URL は `/api/v1/`。

| リソース | エンドポイント例 | 説明 |
|---|---|---|
| 認証 | `POST /api/v1/auth/token/` | JWT トークン取得 |
| ユーザー | `GET /api/v1/users/me/` | 自分のプロフィール取得 |
| 学習計画 | `GET/POST /api/v1/plans/` | 計画一覧・作成 |
| タスク | `GET/POST /api/v1/plans/{id}/tasks/` | タスク一覧・作成 |
| セッション | `GET/POST /api/v1/sessions/` | 1on1 セッション一覧・作成 |

- レスポンスは常に JSON 形式
- エラーレスポンスは `{ "error": { "code": "...", "message": "..." } }` の形式で統一
- ページネーションは `limit` / `offset` を使用

---

## コーディング規約

### 共通
- コメントは **日本語** で記述する
- 変数名・関数名・クラス名は **英語** を使用する
- TODO コメントは `# TODO(担当者): 内容` の形式で記述する

### Python（バックエンド）
- **フォーマッター**: `black`
- **リンター**: `ruff`
- 型ヒントを必ず付与する（`from __future__ import annotations` を活用）
- ユースケースクラスは `execute()` メソッドを持つ単一責任クラスとして実装する

```python
# 良い例：ユースケースの実装
class CreateStudyPlanUseCase:
    def __init__(self, plan_repository: AbstractPlanRepository) -> None:
        self._plan_repository = plan_repository

    def execute(self, command: CreateStudyPlanCommand) -> StudyPlan:
        plan = StudyPlan.create(
            title=command.title,
            target_date=command.target_date,
            user_id=command.user_id,
        )
        return self._plan_repository.save(plan)
```

### TypeScript（フロントエンド）
- **フォーマッター**: Prettier
- **リンター**: ESLint
- `interface` よりも `type` を優先する
- `as` キャストは極力避け、型ガードを使用する
- カスタム hooks の命名は `use` プレフィックスを必ず付ける

---

## 開発環境セットアップ

```bash
# リポジトリクローン後

# バックエンド
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements/development.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver

# フロントエンド
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

---

## 環境変数

### バックエンド（`.env`）
```
SECRET_KEY=
DEBUG=True
DATABASE_URL=postgres://user:password@localhost:5432/study_coaching
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### フロントエンド（`.env.local`）
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## テスト方針

- バックエンド: `pytest` + `pytest-django` を使用
  - ユースケースの単体テストを必ず作成する
  - リポジトリはモックを使ってユースケースをテストする
- フロントエンド: `Jest` + `React Testing Library` を使用
  - カスタム hooks・ユーティリティ関数の単体テストを作成する

---

## Git 運用

- ブランチ戦略: GitHub Flow
- ブランチ命名: `feature/`, `fix/`, `chore/` プレフィックスを使用
- コミットメッセージ: Conventional Commits に準拠
  - 例: `feat: ガントチャートのドラッグ&ドロップ機能を追加`
  - 例: `fix: タスク日付の計算ロジックを修正`
- PR はセルフレビュー後にレビュアーをアサインする

---

## 注意事項・禁止事項

- ビジネスロジックを View・Serializer・コンポーネントに書かない
- `domain/` 層に Django / DRF / Next.js を import しない
- フロントエンドで `any` 型を使用しない
- ハードコードされた認証情報・API キーをコードに含めない（必ず環境変数を使用する）
- DB への直接アクセスを `infrastructure/` 層以外から行わない