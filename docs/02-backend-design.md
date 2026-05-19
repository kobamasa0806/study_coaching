# 02. バックエンド設計書 (Django + DRF)

## 1. ディレクトリ構成

```
app/backend/
├── manage.py
├── pytest.ini
├── requirement.txt              # (空、互換用)
├── requirements/
│   ├── base.txt                 # 共通依存
│   └── development.txt          # 開発依存 (pytest 系)
├── requirments.lock
├── config/
│   ├── settings/
│   │   ├── base.py              # 共通設定
│   │   ├── development.py       # 開発設定
│   │   └── production.py        # 本番設定
│   ├── urls.py                  # ルート URL ルーティング
│   └── wsgi.py
└── apps/
    ├── users/                   # ユーザー / Cognito 認証
    ├── plans/                   # 学習計画
    ├── tasks/                   # タスク (ガントチャート要素)
    ├── sessions/                # 1on1 セッション
    └── admin_panel/             # コーチ向け管理 API
```

各アプリは原則として以下のサブパッケージを持ちます。

```
<app>/
├── domain/
│   ├── models.py        # Entity / Value Object
│   └── repositories.py  # Repository IF (ABC)
├── application/
│   └── use_cases.py     # UseCase (execute メソッド)
├── infrastructure/
│   ├── models.py        # Django ORM Model
│   └── repositories.py  # Repository 実装
├── presentation/
│   ├── views.py
│   ├── serializers.py
│   └── urls.py
├── migrations/
└── tests/
```

> `admin_panel` のみ `presentation/` 単体構成 (集計のため Django ORM の `annotate` を直接利用)。

---

## 2. 共通基盤 (config)

### 2.1 settings/base.py

| 設定 | 値 / 概要 |
|---|---|
| `AUTH_USER_MODEL` | `"users.UserModel"` |
| `DATABASES` | PostgreSQL (`psycopg2`)、SSL モード `DB_SSLMODE` 環境変数 |
| `LANGUAGE_CODE` | `ja` |
| `TIME_ZONE` | `Asia/Tokyo` |
| `USE_TZ` | True |
| `INSTALLED_APPS` | DRF, simplejwt, corsheaders, apps.users / plans / tasks / sessions / admin_panel |
| `MIDDLEWARE` | Security, **CorsMiddleware**, Session, Common, Csrf, Auth, Messages, Clickjacking |

#### DRF 設定

```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.users.infrastructure.cognito_auth.CognitoJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "20/minute", "user": "100/minute"},
}
```

#### SimpleJWT 設定 (将来用)

| 項目 | 値 |
|---|---|
| `ACCESS_TOKEN_LIFETIME` | 15 分 |
| `REFRESH_TOKEN_LIFETIME` | 7 日 |
| `ROTATE_REFRESH_TOKENS` | True |
| `BLACKLIST_AFTER_ROTATION` | True |
| `AUTH_HEADER_TYPES` | `("Bearer",)` |
| `SIGNING_KEY` | `JWT_SIGNING_KEY` (未設定時は `SECRET_KEY`) |

> 現状は Cognito の `id_token` を `CognitoJWTAuthentication` で検証する方式が主。SimpleJWT 設定は将来的なローカル発行用に同梱。

#### Cognito 設定

```python
AWS_COGNITO_REGION         # 例: ap-northeast-1
AWS_COGNITO_USER_POOL_ID
AWS_COGNITO_APP_CLIENT_ID
```

#### セキュリティヘッダー

| ヘッダー | 値 |
|---|---|
| `SECURE_CONTENT_TYPE_NOSNIFF` | True |
| `X_FRAME_OPTIONS` | `DENY` |
| `SECURE_REFERRER_POLICY` | `strict-origin-when-cross-origin` |
| `SESSION_COOKIE_SAMESITE` | `Strict` |
| `CSRF_COOKIE_SAMESITE` | `Strict` |

#### ロギング

| ロガー | 用途 |
|---|---|
| `audit` | 管理者アクション (コーチ作成、管理 API アクセス) を INFO で記録 |
| `django` | 警告以上 |
| root | INFO 以上 |

### 2.2 settings/development.py

```python
DEBUG = True
CORS_ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
```

### 2.3 settings/production.py

```python
DEBUG = False
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 3600
```

### 2.4 config/urls.py

```python
urlpatterns = [
    path(DJANGO_ADMIN_URL, admin.site.urls),
    path("api/v1/auth/",                          include("apps.users.presentation.urls")),
    path("api/v1/plans/",                         include("apps.plans.presentation.urls")),
    path("api/v1/plans/<uuid:plan_id>/tasks/",    include("apps.tasks.presentation.urls")),
    path("api/v1/sessions/",                      include("apps.sessions.presentation.urls")),
    path("api/v1/admin/",                         include("apps.admin_panel.presentation.urls")),
]
```

---

## 3. apps.users (ユーザー / 認証)

### 3.1 Domain

```python
# users/domain/models.py
@dataclass
class User:
    id: UUID
    email: str
    username: str
    is_active: bool
    created_at: datetime

# users/domain/repositories.py
class AbstractUserRepository(ABC):
    def find_by_email(self, email: str) -> User | None: ...
    def find_by_id(self, user_id: UUID) -> User | None: ...
    def create(self, email: str, username: str, password: str) -> User: ...
```

### 3.2 Application

| UseCase | コマンド | 出力 | 主要ロジック |
|---|---|---|---|
| `RegisterUserUseCase` | `RegisterUserCommand(email, username, password)` | `User` | 重複時 `ValueError` |
| `CreateCoachUseCase` | `CreateCoachCommand(email)` | `None` | Cognito に作成し `coaches` グループへ追加 |

### 3.3 Infrastructure

#### UserModel (Django ORM)

```python
class UserModel(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
```

#### CognitoJWTAuthentication

`Authorization: Bearer <id_token>` から Cognito `id_token` を取り出し、以下の手順で検証します。

1. JWKS を Cognito の `/.well-known/jwks.json` から取得 (TTL 1 時間でメモリキャッシュ)
2. `python-jose` で RS256 検証 (issuer / audience / 期限を検証)
3. `email` クレームでローカル `UserModel` を取得、無ければ自動作成
4. `cognito:groups` に `"coaches"` を含む場合 `is_staff=True` に同期

| 例外 | レスポンス |
|---|---|
| `ExpiredSignatureError` | `AuthenticationFailed("トークンの有効期限が切れています。")` |
| `JWTError` | `AuthenticationFailed("無効なトークンです。")` |
| email 不正 | `AuthenticationFailed("トークンに含まれるメールアドレスが無効です。")` |
| JWKS 取得失敗 | `AuthenticationFailed("認証サーバーへの接続に失敗しました。")` |

#### CognitoAdminService

`boto3` で `cognito-idp` クライアントを生成し、以下 API を呼びます。

- `AdminCreateUser` — 仮パスワードはメール送信
- `AdminAddUserToGroup` — `coaches` グループへ追加

必要な AWS IAM 権限: `cognito-idp:AdminCreateUser`, `cognito-idp:AdminAddUserToGroup`

例外: `CoachCreationError` (重複 / 作成失敗 / グループ追加失敗を区別)

### 3.4 Presentation

| クラス | URL | メソッド | 権限 | 概要 |
|---|---|---|---|---|
| `MeView` | `/api/v1/auth/me/` | GET | `IsAuthenticated` | ログイン中ユーザー情報を返す |
| `CreateCoachView` | `/api/v1/auth/coaches/` | POST | `IsAdminUser` | コーチアカウント作成。`audit` ロガーに実行者・対象を記録 |

シリアライザ:
- `RegisterSerializer(email, username, password)` — Django パスワードバリデータ適用
- `CreateCoachSerializer(email)`
- `UserResponseSerializer(id, email, username, is_staff, created_at)`

---

## 4. apps.plans (学習計画)

### 4.1 Domain

```python
class PlanStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"

@dataclass
class StudyPlan:
    id: UUID
    user_id: UUID
    title: str
    description: str
    target_date: date
    status: PlanStatus
    created_at: datetime
    updated_at: datetime

class AbstractPlanRepository(ABC):
    def find_by_id(self, plan_id) -> StudyPlan | None: ...
    def find_by_user_id(self, user_id) -> list[StudyPlan]: ...
    def create(self, user_id, title, description, target_date) -> StudyPlan: ...
    def update(self, plan_id, title, description, target_date, status) -> StudyPlan: ...
    def delete(self, plan_id) -> None: ...
```

### 4.2 Application

| UseCase | 概要 | エラー |
|---|---|---|
| `CreateStudyPlanUseCase` | 計画作成 | — |
| `ListStudyPlansUseCase` | ユーザーの計画一覧 | — |
| `GetStudyPlanUseCase` | 計画取得。`user_id` 不一致は `PermissionError` | `ValueError` / `PermissionError` |
| `UpdateStudyPlanUseCase` | 権限チェック後に更新 | 同上 |
| `DeleteStudyPlanUseCase` | 権限チェック後に削除 | 同上 |

### 4.3 Infrastructure

#### PlanModel

```python
class PlanModel(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "進行中"
        COMPLETED = "completed", "完了"
        ARCHIVED = "archived", "アーカイブ"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=CASCADE, related_name="plans")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    target_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "plans"
        ordering = ["-created_at"]
```

### 4.4 Presentation

| クラス | URL | メソッド |
|---|---|---|
| `PlanListCreateView` | `/api/v1/plans/` | GET / POST |
| `PlanDetailView` | `/api/v1/plans/<plan_id>/` | GET / PUT / DELETE |

権限なし / 不在は **共に 404 NOT_FOUND を返す** (リソース存在の漏洩防止)。

---

## 5. apps.tasks (タスク)

### 5.1 Domain

```python
class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

@dataclass
class Task:
    id: UUID
    plan_id: UUID
    title: str
    description: str
    start_date: date | None
    end_date: date | None
    plan_dates: list[str]    # "YYYY-MM-DD" ガントチャートの計画日付
    actual_dates: list[str]  # "YYYY-MM-DD" ガントチャートの実績日付
    status: TaskStatus
    order: int
    created_at: datetime
    updated_at: datetime
```

### 5.2 Application

| UseCase | 概要 |
|---|---|
| `CreateTaskUseCase` | order を `count_by_plan_id() + 1` で自動採番。`start_date` / `end_date` 未指定時は `plan_dates` の最小・最大から導出 |
| `ListTasksUseCase` | order 昇順で一覧 |
| `GetTaskUseCase` | `plan_id` 不一致は `ValueError` |
| `UpdateTaskUseCase` | `plan_dates` から `start_date` / `end_date` 自動導出 (明示指定優先) |
| `DeleteTaskUseCase` | 削除 |

### 5.3 Infrastructure

#### TaskModel

```python
class TaskModel(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "未着手"
        IN_PROGRESS = "in_progress", "進行中"
        COMPLETED = "completed", "完了"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    plan = models.ForeignKey("plans.PlanModel", on_delete=CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    plan_dates = models.JSONField(default=list)      # ["YYYY-MM-DD", ...]
    actual_dates = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    order = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tasks"
        ordering = ["order", "start_date"]
```

### 5.4 Presentation

| クラス | URL | メソッド |
|---|---|---|
| `TaskListCreateView` | `/api/v1/plans/<plan_id>/tasks/` | GET / POST |
| `TaskDetailView` | `/api/v1/plans/<plan_id>/tasks/<task_id>/` | GET / PUT / DELETE |

カスタムフィールド `DateStringField` で `"YYYY-MM-DD"` 形式のみ許容。

ヘルパー `_verify_plan_access(plan_id, user_id)` で対象プランへのアクセス権を検証。

---

## 6. apps.sessions (1on1)

### 6.1 Domain

```python
class SessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

@dataclass
class Session:
    id: UUID
    user_id: UUID
    scheduled_at: datetime
    memo: str       # 事前メモ / アジェンダ
    summary: str    # セッション後のまとめ
    status: SessionStatus
    created_at: datetime
    updated_at: datetime
```

### 6.2 Application — 重要ビジネスルール

| UseCase | ルール |
|---|---|
| `UpdateSessionUseCase` | **完了済み (`COMPLETED`) のセッションは `scheduled_at` を変更不可** |
| `DeleteSessionUseCase` | **完了済みセッションは削除不可** |

権限チェックは `user_id` 一致。違反は `ValueError` / `PermissionError`。

### 6.3 Infrastructure (SessionModel)

```python
class SessionModel(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "予定済み"
        COMPLETED = "completed", "完了"
        CANCELLED = "cancelled", "キャンセル"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=CASCADE, related_name="sessions")
    scheduled_at = models.DateTimeField()
    memo = models.TextField(blank=True, default="")
    summary = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sessions"
        ordering = ["-scheduled_at"]
```

### 6.4 Presentation

| クラス | URL | メソッド |
|---|---|---|
| `SessionListCreateView` | `/api/v1/sessions/` | GET / POST |
| `SessionDetailView` | `/api/v1/sessions/<session_id>/` | GET / PUT / DELETE |

---

## 7. apps.admin_panel

`domain` / `application` / `infrastructure` を持たず、`presentation/views.py` で Django ORM の `annotate` を直接利用しています (集計のみのため UseCase 層を省略)。

### 7.1 AdminStatsView (GET `/api/v1/admin/stats/`)

権限: `IsAdminUser` (`is_staff=True` のみ)

レスポンス例:

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
- 当月初日 00:00 JST 以降に作成されたユーザーを `new_users_this_month` に計上
- 1 件以上計画を持つユーザーを `active_users` とみなす

### 7.2 AdminUserListView (GET `/api/v1/admin/users/`)

Django ORM の `annotate` で計画 / タスクの件数を集計:

```python
UserModel.objects.annotate(
    plan_count=Count("plans", distinct=True),
    completed_plan_count=Count("plans", filter=Q(plans__status="completed"), distinct=True),
    task_count=Count("plans__tasks", distinct=True),
    completed_task_count=Count(
        "plans__tasks",
        filter=Q(plans__tasks__status="completed"),
        distinct=True,
    ),
).order_by("-created_at")
```

### 7.3 監査ログ

両 View で `audit` ロガーにアクセスを記録:

```
管理者 API アクセス: endpoint=admin/stats user=<email> ip=<X-Forwarded-For 末尾>
```

---

## 8. エラーハンドリング規約

すべての API は失敗時に統一フォーマットを返します。

```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | BAD_REQUEST | ...",
    "message": "人間可読なメッセージ"
  }
}
```

| ステータス | コード例 | 用途 |
|---|---|---|
| 400 | `VALIDATION_ERROR` / `BAD_REQUEST` | Serializer 失敗 / ビジネスルール違反 |
| 401 | (DRF 既定) | 認証失敗 / トークン期限切れ |
| 404 | `NOT_FOUND` | 不在 / 権限なし (情報漏洩を避けるため統一) |

ユースケース層は以下の標準例外を投げ、View がステータスコードへマッピングします。

| 例外 | 意味 |
|---|---|
| `ValueError` | リソース不在 / ビジネスルール違反 |
| `PermissionError` | 権限不足 (View では 404 に丸める) |
| `CoachCreationError` | コーチ作成失敗 (Cognito 起因) |

---

## 9. テスト

### 9.1 設定

`pytest.ini`:

```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.development
python_files = test_*.py
python_classes = Test*
python_functions = test_*
testpaths = apps
```

### 9.2 方針

- **UseCase の単体テスト** が必須。リポジトリは `unittest.mock.MagicMock` でモック
- リポジトリ実装は基本的にカバレッジから外し (Django ORM の薄いラッパー)、UseCase の振る舞いに集中
- 既存テスト例: `apps/tasks/tests/test_use_cases.py`
  - `TestCreateTaskUseCase.test_正常作成`
  - `TestCreateTaskUseCase.test_plan_datesからstart_end_dateを導出`
  - `TestGetTaskUseCase.test_存在しないタスクでValueError`
  - `TestUpdateTaskUseCase.test_正常更新`
  - `TestDeleteTaskUseCase.test_正常削除`

### 9.3 実行

```bash
pytest                      # 全テスト
pytest apps/tasks/tests/   # 特定アプリ
pytest -v                  # 詳細
```

---

## 10. 依存パッケージ (requirements/base.txt)

```
Django==6.0.5
djangorestframework==3.17.1
djangorestframework-simplejwt==5.5.1
django-cors-headers==4.9.0
python-decouple==3.8
psycopg2-binary==2.9.12
python-jose[cryptography]==3.3.0
requests==2.32.3
boto3==1.38.22
```

開発用 (`requirements/development.txt`):

```
-r base.txt
pytest==8.4.0
pytest-django==4.10.0
```
