# 06. 認証フロー設計書

## 1. 全体方針

- AWS **Cognito Hosted UI** を利用した OAuth 2.0 / OpenID Connect の **Authorization Code Flow + PKCE**
- フロントエンドは公開クライアント (Public Client / No Secret) のため **PKCE 必須**
- 取得した `id_token` を **Cookie (`SameSite=Strict`)** に保存し、API リクエスト時に `Authorization: Bearer` で送信
- バックエンドは Cognito **JWKS で署名検証** し、ユーザーを自動取得 / 作成
- Cognito `coaches` グループ所属を `is_staff=True` として同期

> `localStorage` は使用しない (XSS 経由のトークン漏洩を抑制)。

---

## 2. シーケンス図 — ログイン

```
[User]    [Browser /            [Next.js          [Cognito        [Backend
          Next.js SPA]          /callback]        Hosted UI]      DRF]
   |          |                    |                  |              |
   | クリック  |                    |                  |              |
   |--------->|                    |                  |              |
   |          | (1) initiateLogin()|                  |              |
   |          |   - code_verifier 生成                |              |
   |          |   - code_challenge=SHA256(verifier)   |              |
   |          |   - state 生成                        |              |
   |          |   - sessionStorage 保存               |              |
   |          |                                       |              |
   |          | (2) redirect /oauth2/authorize?       |              |
   |          |     code_challenge=...&state=...      |              |
   |          |-------------------------------------->|              |
   |          |                                       |              |
   |          |    Cognito ログイン画面で入力          |              |
   |          |<--------------------------------------|              |
   |          |                                       |              |
   |          | (3) redirect /callback?code=...&state=...            |
   |          |<--------------------------------------|              |
   |          |                                       |              |
   |          | (4) state 検証                                       |
   |          |                                                      |
   |          | (5) exchangeCodeForTokens(code)                      |
   |          |     POST /oauth2/token                               |
   |          |     code, code_verifier ----------------> [Cognito]  |
   |          |     id_token, refresh_token <------------ [Cognito]  |
   |          |                                                      |
   |          | (6) saveTokens() → Cookie に保存                     |
   |          |                                                      |
   |          | (7) router.push("/dashboard")                        |
   |          |                                                      |
   |          | (8) getMe()                                          |
   |          |     Authorization: Bearer <id_token>                 |
   |          |----------------------------------------------------->|
   |          |                                                      |
   |          |                                  (9) JWKS で検証      |
   |          |                                  (10) ユーザー取得    |
   |          |                                      or 自動作成      |
   |          |                                                      |
   |          | { id, email, username, is_staff, created_at } <------|
   |          |                                                      |
```

---

## 3. PKCE 実装詳細

### 3.1 フロントエンド (`lib/auth/cognito.ts`)

```ts
// initiateLogin の概略
const codeVerifier  = generateRandomString(64);            // 高エントロピー
const codeChallenge = base64urlEncode(await sha256(codeVerifier));
const state         = generateRandomString(32);

sessionStorage.setItem("cognito_code_verifier", codeVerifier);
sessionStorage.setItem("cognito_state", state);

const url = new URL(`${COGNITO_DOMAIN}/oauth2/authorize`);
url.searchParams.set("client_id",       CLIENT_ID);
url.searchParams.set("response_type",   "code");
url.searchParams.set("scope",           "openid email profile");
url.searchParams.set("redirect_uri",    REDIRECT_URI);
url.searchParams.set("code_challenge",  codeChallenge);
url.searchParams.set("code_challenge_method", "S256");
url.searchParams.set("state",           state);

window.location.href = url.toString();
```

### 3.2 コード → トークン交換

```ts
// exchangeCodeForTokens
const params = new URLSearchParams({
  grant_type:    "authorization_code",
  client_id:     CLIENT_ID,
  code,
  redirect_uri:  REDIRECT_URI,
  code_verifier: sessionStorage.getItem("cognito_code_verifier")!,
});

const res = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
  method:  "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body:    params.toString(),
});

const { id_token, refresh_token, access_token, expires_in } = await res.json();
```

### 3.3 Cookie 保存

| Cookie | 値 | 有効期限 | 属性 |
|---|---|---|---|
| `id_token` | Cognito id_token | 86400 秒 (1 日) | `Path=/; SameSite=Strict; Secure*` |
| `refresh_token` | Cognito refresh_token | 2592000 秒 (30 日) | 同上 |

*`Secure` 属性は HTTPS 環境でのみ付与。

---

## 4. トークン更新

```ts
// refreshIdToken
const params = new URLSearchParams({
  grant_type:    "refresh_token",
  client_id:     CLIENT_ID,
  refresh_token: getRefreshToken()!,
});

const res = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
  method:  "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body:    params.toString(),
});

if (!res.ok) {
  clearTokens();
  return null;
}

const tokens = await res.json();
saveTokens(tokens);
return tokens;
```

`useAuth()` の初期化時に `getMe()` が失敗した場合に自動でリフレッシュを試み、失敗時のみ未認証扱いに遷移します。

---

## 5. ログアウト

```ts
// cognitoLogout
const url = new URL(`${COGNITO_DOMAIN}/logout`);
url.searchParams.set("client_id", CLIENT_ID);
url.searchParams.set("logout_uri", LOGOUT_URI);
clearTokens();
window.location.href = url.toString();
```

- ローカル Cookie を即時クリア
- Cognito 側のセッションを失効させるため `/logout` にリダイレクト
- `logout_uri` のホストは Cognito アプリクライアント側で許可リスト登録が必要

---

## 6. バックエンドでの JWT 検証

### 6.1 `CognitoJWTAuthentication.authenticate`

1. `Authorization: Bearer <token>` を抽出
2. `_get_jwks()` で `https://cognito-idp.<region>.amazonaws.com/<user_pool_id>/.well-known/jwks.json` を取得
   - メモリキャッシュ TTL 1 時間
3. `python-jose.jwt.decode` で RS256 検証
   - `audience = AWS_COGNITO_APP_CLIENT_ID`
   - `issuer  = https://cognito-idp.<region>.amazonaws.com/<user_pool_id>`
4. クレームから `email` を取り出し `UserModel` を `get_or_create`
5. `cognito:groups` に `coaches` を含む場合 `is_staff=True` に同期保存

### 6.2 失敗時のレスポンス

| 原因 | HTTP | メッセージ |
|---|---|---|
| 期限切れ | 401 | `"トークンの有効期限が切れています。"` |
| 署名不正 / クレーム不正 | 401 | `"無効なトークンです。"` |
| email クレーム不在 | 401 | `"トークンに含まれるメールアドレスが無効です。"` |
| JWKS 取得不可 | 401 | `"認証サーバーへの接続に失敗しました。"` |

---

## 7. ルート保護 (Next.js middleware)

`middleware.ts` で Edge ランタイム実行。`request.cookies.get("id_token")` の有無のみで判定し、署名検証は行わない (粗いフィルタ)。

```
保護対象 (id_token 必須):
  /dashboard, /plans, /study-plan, /sessions, /admin

認証ページ (id_token あれば /dashboard へ):
  /login, /register

完全公開:
  /, /callback
```

未認証で保護対象にアクセスした場合は `?next=<元のパス>` をクエリに付けて `/login` へリダイレクト。

---

## 8. コーチアカウント発行フロー

1. 管理者 (`is_staff=True`) が `/admin` 等から `POST /api/v1/auth/coaches/ { "email": "..." }` を実行
2. `CreateCoachUseCase` が `AbstractCognitoAdminService.create_coach(email)` を呼ぶ
3. `CognitoAdminService` が `boto3` で以下を実行:
   - `cognito_idp.admin_create_user(...)` — 仮パスワードはメール送信
   - `cognito_idp.admin_add_user_to_group(GroupName="coaches", ...)`
4. 新コーチが受信メールから Cognito Hosted UI で初回ログインし、パスワードを更新
5. 初回 API 呼び出し時に `CognitoJWTAuthentication._get_or_create_user` が `is_staff=True` でローカルユーザーを作成

### 必要な AWS IAM 権限

```
cognito-idp:AdminCreateUser
cognito-idp:AdminAddUserToGroup
```

---

## 9. セキュリティ考慮

| 脅威 | 対策 |
|---|---|
| 認可コード横取り | PKCE (S256) で `code_verifier` を所有者のみ知り得る形に |
| CSRF (OAuth) | `state` パラメータを `sessionStorage` で照合 |
| CSRF (Cookie) | `SameSite=Strict` で送信を抑止 |
| XSS によるトークン漏洩 | `localStorage` 不使用。ただし `id_token` は JS から参照可能なため、CSP + 厳格な HTML エスケープを徹底 |
| JWKS なりすまし | HTTPS で JWKS を取得し、`python-jose` で RS256 検証 |
| トークン期限切れ | `id_token` 1 日 / `refresh_token` 30 日。`useAuth` で自動リフレッシュ |
| コーチ権限の昇格 | `coaches` グループ追加は IAM 制限された Admin API 経由のみ。`is_staff` はバックエンドが `cognito:groups` を起点に同期 |
| 管理 API の濫用 | `IsAdminUser` で権限制御。`audit` ロガーに実行者・IP を残す |
| レート制限 | 未認証 20 r/m, 認証済み 100 r/m (DRF Throttle) |

---

## 10. 環境変数

### 10.1 フロントエンド (`.env.local`)

```
NEXT_PUBLIC_COGNITO_DOMAIN=https://<your-domain>.auth.ap-northeast-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000
```

### 10.2 バックエンド (`.env`)

```
AWS_COGNITO_REGION=ap-northeast-1
AWS_COGNITO_USER_POOL_ID=
AWS_COGNITO_APP_CLIENT_ID=
AWS_ACCESS_KEY_ID=          # コーチ作成 API 用 (IAM 最小権限)
AWS_SECRET_ACCESS_KEY=
```

> 本番環境では IAM Role / シークレットマネージャー経由での注入を推奨。
