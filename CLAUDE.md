# CLAUDE.md — study-coaching

## プロジェクト概要

**study-coaching** は、資格取得を目指すユーザーの学習を支援するアプリケーションです。
学習計画の立案・進捗記録をガントチャートで可視化し、管理者（コーチ）との 1on1 を通じて継続的な進捗管理を行います。

---

## 技術スタック

### フロントエンド
- **フレームワーク**: Next.js 15 (App Router)
- **UI ライブラリ**: React 19
- **スタイリング**: Tailwind CSS
- **アイコン**: `lucide-react`
- **日付操作**: `date-fns`
- **ガントチャート**: カスタム実装（HTML テーブルベース。外部ライブラリ不使用）
- **HTTP クライアント**: fetch（Next.js 標準）
- **テスト**: Jest + React Testing Library
- **レスポンシブ**: Tailwind のブレークポイント (`sm` / `md` / `lg`) を活用

### バックエンド
- **フレームワーク**: Django 6 + Django REST Framework (DRF)
- **認証**: AWS Cognito（Hosted UI + PKCE フロー）。バックエンドは Cognito id_token を検証するカスタム認証クラス (`CognitoJWTAuthentication`) を使用
- **DB**: PostgreSQL
- **ORM**: Django ORM
- **バリデーション**: DRF Serializer
- **CORS**: `django-cors-headers`
- **環境変数管理**: `python-decouple`
- **AWS 連携**: `boto3`（Cognito 管理操作）、`python-jose`（JWT 検証）

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
app/backend/
├── config/                  # Django 設定・ルーティング
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/               # ユーザー・Cognito 認証
│   │   ├── domain/          # エンティティ・値オブジェクト・リポジトリIF
│   │   ├── application/     # ユースケース
│   │   ├── infrastructure/  # Django ORM 実装・Cognito アダプター
│   │   └── presentation/    # DRF APIView・Serializer・URLs
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
│   ├── sessions/            # 1on1 セッション管理
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── presentation/
│   └── admin_panel/         # コーチ向け管理画面 API（統計・ユーザー一覧）
│       └── presentation/
├── manage.py
└── requirement.txt
```

#### 各ディレクトリの責務

| ディレクトリ | 責務 |
|---|---|
| `domain/` | エンティティ、値オブジェクト、リポジトリインターフェース（抽象クラス）。外部依存ゼロ |
| `application/` | ユースケース。ドメインを orchestrate する。DI でリポジトリを受け取る |
| `infrastructure/` | Django ORM を使ったリポジトリ実装、Cognito など外部 API アダプター |
| `presentation/` | DRF の APIView、Serializer、URL ルーティング |

**ルール:**
- `domain/` は Django・DRF を一切 import しない
- `application/` は `presentation/` を import しない
- Serializer はデータの変換のみ担当し、ビジネスロジックを持たない
- ビジネスロジックは必ず `domain/` または `application/` に記述する

---

### フロントエンド構成（Next.js）

```
app/frontend/
├── app/                     # App Router ページ
│   ├── (auth)/              # 認証関連ページ（login・register・callback）
│   ├── admin/               # コーチ向け管理ページ
│   ├── components/          # ページ固有コンポーネント（Navbar, Hero 等）
│   ├── dashboard/           # ダッシュボード
│   ├── plans/               # 学習計画一覧
│   ├── sessions/            # 1on1 セッション
│   └── study-plan/          # ガントチャート表示・編集
│       └── components/      # GanttChart コンポーネント
├── features/                # 機能単位のロジック（カスタム hooks）
│   ├── auth/                # useAuth
│   └── plans/               # usePlanGantt
├── lib/
│   ├── api/                 # API クライアント・エンドポイント定義（client, auth, plans, tasks, sessions, admin）
│   ├── auth/                # Cognito 認証ユーティリティ（PKCE, トークン管理）
│   └── types/               # TypeScript 型定義（auth, plans, sessions, admin）
└── middleware.ts             # ルート保護（Cookie の id_token を参照）
```

**ルール:**
- `app/` 配下の Page コンポーネントは薄く保ち、ロジックは `features/` に集約する
- API 通信は必ず `lib/api/` 経由で行い、コンポーネントから直接 fetch しない
- 型定義は `lib/types/` で一元管理し、`any` の使用を禁止する

---

## 認証フロー

### Cognito Hosted UI + PKCE

```
1. フロントエンド: initiateLogin() → PKCE + state 生成 → Cognito Hosted UI へリダイレクト
2. Cognito Hosted UI: ユーザーがメール＋パスワードでログイン
3. Cognito → /callback?code=...&state=... にリダイレクト
4. フロントエンド: exchangeCodeForTokens() → id_token / refresh_token を Cookie に保存
5. バックエンド: Authorization: Bearer <id_token> を CognitoJWTAuthentication で検証
```

- トークンは Cookie のみに保存（`SameSite=Strict`）。localStorage は使用しない
- Next.js middleware が Cookie の `id_token` を参照してルートを保護する
- バックエンドは Cognito JWKS を TTL 1時間でキャッシュして検証する
- Cognito の `coaches` グループに属するユーザーは `is_staff=True` として同期される

---

## API 設計

RESTful API として設計します。ベース URL は `/api/v1/`。

| リソース | エンドポイント | 説明 |
|---|---|---|
| ユーザー情報 | `GET /api/v1/auth/me/` | ログイン中ユーザーのプロフィール取得 |
| コーチ作成 | `POST /api/v1/auth/coaches/` | コーチアカウント作成（`is_staff` のみ） |
| 学習計画 | `GET/POST /api/v1/plans/` | 計画一覧・作成 |
| タスク | `GET/POST /api/v1/plans/{id}/tasks/` | タスク一覧・作成 |
| セッション | `GET/POST /api/v1/sessions/` | 1on1 セッション一覧・作成 |
| 管理統計 | `GET /api/v1/admin/stats/` | サービス全体統計（`is_staff` のみ） |
| 管理ユーザー | `GET /api/v1/admin/users/` | ユーザー一覧＋利用状況（`is_staff` のみ） |

- Django 管理画面のパスは `DJANGO_ADMIN_URL` 環境変数でカスタマイズ可能（デフォルト: `admin/`）
- レスポンスは常に JSON 形式
- エラーレスポンスは `{ "error": { "code": "...", "message": "..." } }` の形式で統一
- レート制限: 未認証 20回/分、認証済み 100回/分

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
# バックエンド
cd app/backend
python -m venv venv
source venv/bin/activate
pip install -r requirement.txt
cp .env.example .env  # 環境変数を設定する
python manage.py migrate
python manage.py runserver

# フロントエンド
cd app/frontend
npm install
cp .env.local.example .env.local  # 環境変数を設定する
npm run dev
```

---

## 環境変数

### バックエンド（`app/backend/.env`）
```
SECRET_KEY=
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=study_coaching
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
DB_SSLMODE=prefer
AWS_COGNITO_REGION=ap-northeast-1
AWS_COGNITO_USER_POOL_ID=
AWS_COGNITO_APP_CLIENT_ID=
JWT_SIGNING_KEY=           # 省略時は SECRET_KEY を使用
CORS_ALLOWED_ORIGINS=http://localhost:3000
DJANGO_ADMIN_URL=admin/    # 本番環境では必ず変更する
```

### フロントエンド（`app/frontend/.env.local`）
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_COGNITO_DOMAIN=https://<your-domain>.auth.ap-northeast-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000
```

---

## テスト方針

- バックエンド: `pytest` + `pytest-django` を使用（設定は `pytest.ini`）
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
- Cognito トークンを localStorage に保存しない（必ず Cookie を使用する）
