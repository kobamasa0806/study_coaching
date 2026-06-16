#!/usr/bin/env bash
# kensan staging 用パラメータを SSM Parameter Store に一括投入するスクリプト
#
# ╔══════════════════════════════════════════════════════════════════╗
# ║  ⚠️ このローカルファイルには絶対に実際のシークレット値を貼らない  ║
# ║  ⚠️ <<PASTE_...>> を書き換えるのは CloudShell 上のコピーでのみ  ║
# ║  ⚠️ 編集時は必ず Git でコミットされない状態かを最後に確認すること ║
# ╚══════════════════════════════════════════════════════════════════╝
#
# 実行方法:
#   1. AWS Console 右上の CloudShell アイコン (>_) を開く
#   2. CloudShell 上で nano put-staging-parameters.sh を開き、本ファイル全体を貼り付け
#        (Ctrl+O 保存 / Ctrl+X 終了)
#   3. CloudShell 内の nano で <<PASTE_...>> を実際の値に書き換える ← ローカルでは絶対やらない
#   4. bash put-staging-parameters.sh で実行
#   5. 実行後: rm put-staging-parameters.sh && history -c で痕跡を消す

set -euo pipefail

PREFIX="/kensan/staging"
REGION="ap-northeast-1"

# ===== ローカルで以下を生成して貼り付ける =====
# SECRET_KEY と JWT_SIGNING_KEY:
#   python3 -c "import secrets; print(secrets.token_urlsafe(64))" を 2 回実行
# DB_PASSWORD (32文字英数字):
#   python3 -c "import secrets, string; alphabet = string.ascii_letters + string.digits; print(''.join(secrets.choice(alphabet) for _ in range(32)))"

SECRET_KEY="<<PASTE_SECRET_KEY>>"
JWT_SIGNING_KEY="<<PASTE_JWT_SIGNING_KEY>>"
DB_PASSWORD="<<PASTE_DB_PASSWORD>>"

# ===== Step 3 でメモした Cognito の値 =====
COGNITO_USER_POOL_ID="<<PASTE_USER_POOL_ID>>"        # 例: ap-northeast-1_AbCdEf123
COGNITO_APP_CLIENT_ID="<<PASTE_APP_CLIENT_ID>>"      # 例: 1234567890abcdefghij
COGNITO_DOMAIN="<<PASTE_COGNITO_DOMAIN_URL>>"        # 例: https://kensan-staging.auth.ap-northeast-1.amazoncognito.com

# ===== アプリ固定値 (基本このままで OK) =====
# 管理画面パス: 推測困難な文字列に。openssl でランダム化済み
DJANGO_ADMIN_URL="kensan-mgmt-$(openssl rand -hex 3)/"
ALLOWED_HOSTS="staging-api.ken-san.dev"
CORS_ALLOWED_ORIGINS="https://staging.ken-san.dev"
ENABLE_HTTPS="1"
DB_NAME="study_coaching"
DB_USER="postgres"

# ===== Parameter Store 投入関数 =====
put_secure() {
  aws ssm put-parameter \
    --region "$REGION" \
    --name "$PREFIX/$1" \
    --value "$2" \
    --type SecureString \
    --overwrite \
    --description "kensan staging $1" \
    > /dev/null
  echo "  [OK] $PREFIX/$1 (SecureString)"
}

put_string() {
  aws ssm put-parameter \
    --region "$REGION" \
    --name "$PREFIX/$1" \
    --value "$2" \
    --type String \
    --overwrite \
    --description "kensan staging $1" \
    > /dev/null
  echo "  [OK] $PREFIX/$1 (String)"
}

# ===== 投入実行 =====
echo "==> シークレット (SecureString) を投入"
put_secure "SECRET_KEY"       "$SECRET_KEY"
put_secure "JWT_SIGNING_KEY"  "$JWT_SIGNING_KEY"
put_secure "DB_PASSWORD"      "$DB_PASSWORD"

echo "==> アプリ設定値 (String) を投入"
put_string "DJANGO_ADMIN_URL"      "$DJANGO_ADMIN_URL"
put_string "ALLOWED_HOSTS"         "$ALLOWED_HOSTS"
put_string "CORS_ALLOWED_ORIGINS"  "$CORS_ALLOWED_ORIGINS"
put_string "ENABLE_HTTPS"          "$ENABLE_HTTPS"
put_string "DB_NAME"               "$DB_NAME"
put_string "DB_USER"               "$DB_USER"

echo "==> Cognito 値 (String) を投入"
put_string "AWS_COGNITO_REGION"         "$REGION"
put_string "AWS_COGNITO_USER_POOL_ID"   "$COGNITO_USER_POOL_ID"
put_string "AWS_COGNITO_APP_CLIENT_ID"  "$COGNITO_APP_CLIENT_ID"
put_string "AWS_COGNITO_DOMAIN"         "$COGNITO_DOMAIN"

echo ""
echo "==> 全 13 件の投入完了。一覧確認:"
aws ssm get-parameters-by-path \
  --path "$PREFIX" \
  --region "$REGION" \
  --query 'Parameters[].Name' \
  --output table
