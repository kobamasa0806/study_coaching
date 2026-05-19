# study-coaching 設計書

本ディレクトリは、`study-coaching` プロジェクトの設計書一式です。
コードベースを起点としてリバースエンジニアリングしたものであり、現状実装に追従した内容を記述しています。

## ドキュメント一覧

| # | ファイル | 内容 |
|---|---|---|
| 1 | [01-overview.md](./01-overview.md) | システム概要 / アーキテクチャ全体像 |
| 2 | [02-backend-design.md](./02-backend-design.md) | バックエンド (Django + DRF) 設計 |
| 3 | [03-frontend-design.md](./03-frontend-design.md) | フロントエンド (Next.js 15) 設計 |
| 4 | [04-api-spec.md](./04-api-spec.md) | REST API 仕様 |
| 5 | [05-data-model.md](./05-data-model.md) | データモデル / ER 図 / スキーマ |
| 6 | [06-auth-flow.md](./06-auth-flow.md) | 認証フロー (Cognito + PKCE) |
| 7 | [07-non-functional.md](./07-non-functional.md) | 非機能要件 / セキュリティ / 運用 |

## 対象読者

- 新規参画する開発者
- バックエンド / フロントエンドそれぞれの担当者
- レビュアー / アーキテクト
- インフラ / SRE 担当
