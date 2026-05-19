# 07. 非機能要件 / セキュリティ / 運用設計

## 1. セキュリティ要件

### 1.1 認証 / 認可

| 項目 | 内容 |
|---|---|
| 認証方式 | AWS Cognito Hosted UI + OAuth 2.0 Authorization Code Flow + PKCE |
| 認可方式 | DRF パーミッション (`IsAuthenticated` / `IsAdminUser`) |
| ロール | 一般ユーザー / コーチ (`is_staff=True`) |
| ロール同期 | Cognito `coaches` グループ → `users.is_staff` を認証時に同期 |
| トークン形式 | Cognito `id_token` (JWT RS256) を Bearer 認証で送信 |
| 検証方式 | Cognito JWKS で署名検証 (TTL 1 時間メモリキャッシュ) |
| トークン保管 | Cookie (`SameSite=Strict`, HTTPS で `Secure`)。**localStorage 不使用** |

### 1.2 セキュリティヘッダー (Django)

| ヘッダー | 値 |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` (本番) |
| `Set-Cookie` (Session/CSRF) | `SameSite=Strict; Secure (本番); HttpOnly (本番)` |

### 1.3 CORS

- 開発: `http://localhost:3000`, `http://127.0.0.1:3000`
- 本番: 環境変数 `CORS_ALLOWED_ORIGINS` で明示指定 (`https://app.example.com` など)

### 1.4 レート制限

| 区分 | 上限 |
|---|---|
| 未認証 (`anon`) | 20 リクエスト / 分 |
| 認証済み (`user`) | 100 リクエスト / 分 |

### 1.5 パスワードポリシー

Django 標準のバリデータを有効化:

- `UserAttributeSimilarityValidator`
- `MinimumLengthValidator` (8 文字以上)
- `CommonPasswordValidator`
- `NumericPasswordValidator`

> 実際のパスワードは Cognito 側で管理されるケースが主のため、Cognito User Pool 側のパスワードポリシー設定も合わせて強化すること。

### 1.6 監査ログ

`audit` ロガーで以下を INFO レベル出力:

| イベント | 出力例 |
|---|---|
| コーチ作成 | `コーチ作成: 実行者=admin@example.com 対象メール=coach@example.com` |
| 管理 API アクセス | `管理者 API アクセス: endpoint=admin/stats user=admin@example.com ip=203.0.113.1` |

`ip` は `X-Forwarded-For` の末尾 (信頼できる直近プロキシの IP) を採用。

---

## 2. パフォーマンス要件

### 2.1 想定負荷

| 指標 | 想定値 |
|---|---|
| 同時接続ユーザー数 | 100 程度 (初期想定) |
| API レイテンシ | p95 < 500ms |
| ガントチャート操作 | 800ms debounce で更新を集約 |

### 2.2 N+1 対策

`AdminUserListView` などの集計クエリは `annotate(Count(..., distinct=True), filter=Q(...))` で 1 クエリにまとめている。今後のクエリ拡張時も以下を遵守:

- 一覧 API では `select_related` / `prefetch_related` を活用
- ユーザー単位の繰り返しクエリを避ける

### 2.3 キャッシュ

| 対象 | 戦略 |
|---|---|
| Cognito JWKS | メモリキャッシュ TTL 1 時間 (`CognitoJWTAuthentication`) |
| API レスポンス | 現状なし。必要に応じて Django キャッシュフレームワーク (Redis) を導入 |

---

## 3. 可用性 / 信頼性

| 観点 | 内容 |
|---|---|
| DB | PostgreSQL マネージドサービス (RDS / Cloud SQL 等) を想定。本番は `DB_SSLMODE=require` |
| 認証 | Cognito 側冗長化に依存 |
| ステートレス API | Django プロセスはステートレス。水平スケール可能 |
| エフェメラル | セッション中の `sessionStorage` (PKCE 用) は失われても再ログインで復旧可能 |

---

## 4. 運用 / デプロイ

### 4.1 環境分離

| 環境 | 設定モジュール | Django ADMIN URL |
|---|---|---|
| development | `config.settings.development` | `admin/` (デフォルト) |
| production | `config.settings.production` | `DJANGO_ADMIN_URL` で難読化必須 |

### 4.2 デプロイ前チェックリスト

- [ ] `DEBUG=False`
- [ ] `SECRET_KEY` を強力なランダム値に
- [ ] `JWT_SIGNING_KEY` を `SECRET_KEY` と分離
- [ ] `ALLOWED_HOSTS` を本番ドメインに限定
- [ ] `CORS_ALLOWED_ORIGINS` を本番 FE URL に限定
- [ ] `DB_SSLMODE=require`
- [ ] `DJANGO_ADMIN_URL` を推測困難な値に変更
- [ ] AWS Cognito アプリクライアントの `Callback URLs` / `Sign out URLs` に本番 URL を登録
- [ ] AWS IAM (コーチ作成用) は `cognito-idp:AdminCreateUser` / `:AdminAddUserToGroup` のみ
- [ ] `SECURE_SSL_REDIRECT=True`, HSTS 設定が有効
- [ ] バックアップ計画 (RDS スナップショット 日次 / RPO・RTO)
- [ ] ログ送信先 (CloudWatch / Cloud Logging) の設定
- [ ] フロントエンド `NEXT_PUBLIC_*` 環境変数を本番値に

### 4.3 マイグレーション

```bash
python manage.py migrate
```

> 本番では `--plan` でレビュー後に適用。

### 4.4 ロギング

| ロガー | 出力先 | レベル |
|---|---|---|
| `audit` | stdout (推奨: 集約基盤に転送) | INFO |
| `django` | stdout | WARNING |
| root | stdout | INFO |

---

## 5. テスト戦略

### 5.1 バックエンド

| レイヤ | 方針 |
|---|---|
| `domain/` | 単純な dataclass / IF。値そのもののテストは不要 (静的型で十分) |
| `application/` | **必須**。リポジトリを `MagicMock` でモックし、ビジネスルールを網羅 |
| `infrastructure/` | Django ORM ラッパー中心。最低限のスモークテスト |
| `presentation/` | DRF テストクライアントで E2E スモークテスト (任意) |

### 5.2 フロントエンド

| レイヤ | 方針 |
|---|---|
| `lib/api/` | `fetch` をモック化して入出力を検証 |
| `lib/auth/` | PKCE フローの主要関数の単体テスト |
| `features/` (hooks) | `renderHook` で初期化フロー / 副作用を検証 |
| `app/` (ページ) | 重要な分岐 (リダイレクト等) のみ Testing Library で確認 |
| `GanttChart` | 表示ロジック / ドラッグの差分計算を単体検証 |

---

## 6. ブラウザ / OS 対応

| 区分 | 対応 |
|---|---|
| デスクトップ | Chrome / Safari / Edge / Firefox 最新版 |
| モバイル | iOS Safari / Android Chrome 最新版 |
| 解像度 | Tailwind のブレークポイント (`sm` / `md` / `lg`) を活用したレスポンシブ |

ガントチャートは横スクロール前提。モバイルでは表の左固定列で項目名を視認可能にする。

---

## 7. アクセシビリティ (a11y)

- セルクリック / ドラッグの代替操作 (キーボード) は **未対応** (今後の改善項目)
- ボタン / リンクには適切な aria 属性 / ラベルを付与する方針
- カラーコントラスト: 計画行 `indigo-500` / 実績行 `emerald-500` は AA 準拠を確認のこと

---

## 8. 国際化 (i18n)

| 項目 | 対応 |
|---|---|
| `LANGUAGE_CODE` | `ja` |
| `TIME_ZONE` | `Asia/Tokyo` |
| `USE_TZ` | True (DB は UTC、表示時に JST 変換) |
| メッセージ | 現状日本語のみ。将来的に `gettext` 対応を検討 |

---

## 9. リスクと既知の制約

| リスク | 影響 | 対応案 |
|---|---|---|
| `useAuth.register()` 未実装 | `/register` ページが機能しない | Cognito Hosted UI のサインアップに統一する / ページを削除 |
| 公開登録エンドポイント不在 | コーチ以外のユーザー作成手段が Cognito Hosted UI に限定される | 現状の方針 (Cognito 経由) を明文化、または独自 `POST /api/v1/auth/register/` を追加 |
| ガントチャート操作のキーボード非対応 | a11y / 業務効率 | キーボード操作 / バルク操作 UI の追加検討 |
| `tasks.plan_dates` の JSONB 探索 | 日付検索クエリのパフォーマンス | 必要なら別テーブル (`task_date_entries`) に正規化 |
| Cognito 障害時の認証停止 | ユーザーがログインできない | ステータス監視 + メンテナンス告知。重要操作は冪等性確保 |
| `id_token` の JS アクセス可能性 | XSS 経由の漏洩 | CSP 強化、依存ライブラリの脆弱性監視 (Dependabot 等) |
