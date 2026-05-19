# 01. システム概要設計書

## 1. プロジェクト概要

**study-coaching** は、資格取得を目指すユーザーの学習を継続的に支援する Web アプリケーションです。
ユーザーは学習計画をガントチャート形式で管理し、コーチとの 1on1 セッションを通じて進捗を共有・改善していきます。

### 1.1 主要ユースケース

| 対象 | 機能 |
|---|---|
| 学習者 | ログイン / 学習計画作成 / タスク管理 (ガントチャート) / 計画日付・実績日付の塗りつぶし / 1on1 セッション予約 |
| コーチ (管理者) | コーチ自身のアカウント発行 / 全ユーザー一覧と利用状況の閲覧 / サービス全体統計の閲覧 |

### 1.2 ロール

- **一般ユーザー (学習者)**: `is_staff=False`
- **コーチ (管理者)**: `is_staff=True` (Cognito の `coaches` グループから同期)

---

## 2. システム構成

### 2.1 ハイレベル構成図

```
+--------------------+        OAuth 2.0 / PKCE       +-----------------------+
|                    | <---------------------------> |                       |
|  Next.js 15 (SPA)  |                               |   AWS Cognito         |
|  - App Router      |        id_token (JWT)         |   - User Pool         |
|  - React 19        |                               |   - Hosted UI         |
|  - Tailwind CSS    |                               |   - coaches グループ  |
+--------------------+                               +-----------------------+
        |                                                       ^
        | Authorization: Bearer <id_token>                      |
        v                                                       | JWKS 検証
+--------------------+                                          |
|                    |                                          |
|  Django 6 + DRF    | -----------------------------------------+
|  - クリーンアーキ  |
|  - Cognito JWT 認証|
|  - DRF Throttle    |
+--------------------+
        |
        | psycopg2 (SSL)
        v
+--------------------+
|                    |
|  PostgreSQL        |
|                    |
+--------------------+
```

### 2.2 技術スタック

| レイヤ | 技術 | バージョン / 補足 |
|---|---|---|
| フロントエンド フレームワーク | Next.js | 15.2.0 (App Router) |
| UI ライブラリ | React | 19.0.0 |
| スタイリング | Tailwind CSS | 3.4.3 |
| アイコン | lucide-react | 0.577.0 |
| 日付処理 | date-fns | 4.1.0 |
| FE テスト | Jest + Testing Library | Jest 30.3.0, jsdom |
| バックエンド フレームワーク | Django + DRF | Django 6.0.5 / DRF 3.17.1 |
| 認証 | AWS Cognito (Hosted UI + PKCE) | python-jose で JWT 検証 |
| DB | PostgreSQL | psycopg2-binary 2.9.12 |
| BE テスト | pytest + pytest-django | 8.4.0 / 4.10.0 |
| 環境変数 | python-decouple | 3.8 |
| AWS SDK | boto3 | 1.38.22 (Cognito 管理) |

---

## 3. アーキテクチャ方針

### 3.1 クリーンアーキテクチャ (バックエンド)

依存方向は **外側 → 内側** の一方向に統一しています。

```
[Presentation]  DRF View / Serializer / URL
       |
       v
[Application]   Use Case (execute メソッド)
       |
       v
[Domain]        Entity / Value Object / Repository IF (Django 非依存)
       ^
       |
[Infrastructure] Django ORM Model / Repository 実装 / Cognito Adapter
```

- `domain/` は Django / DRF を一切 import しない (純粋 Python)
- `application/` は `presentation/` を import しない
- View / Serializer は変換とディスパッチに専念し、ビジネスルールを書かない
- ビジネスルールは必ず `domain/` または `application/` に記述する

### 3.2 フロントエンドの責務分離

```
app/         App Router ページ (薄いラッパー)
features/    機能単位のカスタムフック (useAuth, usePlanGantt)
lib/api/     API クライアント (バックエンド呼び出しの唯一の経路)
lib/auth/    Cognito PKCE フロー / トークン管理
lib/types/   TypeScript 型定義の一元管理
middleware.ts ルート保護 (Cookie の id_token 参照)
```

- ページコンポーネントは薄く保ち、ロジックは `features/` に集約
- `fetch` を component から直接呼ばず、必ず `lib/api/` を経由
- `any` は禁止し、`lib/types/` の型を使用

---

## 4. ドメイン構成

バックエンドは以下 5 アプリで構成しています。

| アプリ | 主要ドメイン | 主要エンドポイント |
|---|---|---|
| `users` | ユーザー / コーチ / Cognito 認証 | `/api/v1/auth/me/`, `/api/v1/auth/coaches/` |
| `plans` | 学習計画 (StudyPlan) | `/api/v1/plans/` |
| `tasks` | タスク (ガントチャート要素) | `/api/v1/plans/{plan_id}/tasks/` |
| `sessions` | 1on1 セッション | `/api/v1/sessions/` |
| `admin_panel` | 管理者向け統計・ユーザー一覧 | `/api/v1/admin/stats/`, `/api/v1/admin/users/` |

詳細な設計は [02-backend-design.md](./02-backend-design.md) を参照してください。

---

## 5. デプロイ / 環境

| 環境 | 設定ファイル | DEBUG | DB SSL |
|---|---|---|---|
| 開発 | `config.settings.development` | True | prefer |
| 本番 | `config.settings.production` | False | require |

- 本番では `SECURE_SSL_REDIRECT`, `HSTS`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` が有効
- Django 管理画面パスは `DJANGO_ADMIN_URL` 環境変数で難読化

---

## 6. 既知の WIP / 未実装項目

| 項目 | 内容 |
|---|---|
| ユーザー登録 | `app/(auth)/register/page.tsx` は `useAuth().register()` を呼ぶが、`useAuth` 側に未実装。バックエンドにも公開登録エンドポイントがない (登録は Cognito Hosted UI 経由を想定) |
| プラン詳細ページ | `/plans/{id}` の編集 UI なし |
| セッション更新 UI | フロントエンドからのステータス更新・サマリー編集 UI が未整備 |
| Error Boundary | React Error Boundary が未配置 |
