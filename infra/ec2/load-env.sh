#!/usr/bin/env bash
# SSM Parameter Store から指定パス配下のパラメータを取得し、
# .env.<environment> 形式のファイルに書き出すスクリプト。
#
# 使い方:
#   bash load-env.sh staging                # /kensan/staging/* → .env.staging
#   bash load-env.sh production             # /kensan/production/* → .env.production
#
# 出力ファイルは KEY=VALUE 形式の 1 行ずつ。docker compose --env-file で読み込める。

set -euo pipefail

ENVIRONMENT="${1:-staging}"
REGION="${AWS_REGION:-ap-northeast-1}"
PARAM_PREFIX="/kensan/${ENVIRONMENT}"
OUTPUT_FILE=".env.${ENVIRONMENT}"

echo "==> Parameter Store からパラメータを取得 (${PARAM_PREFIX}/*)"

# get-parameters-by-path で一括取得 (--with-decryption で SecureString も復号)
# --query で Name と Value を取り出し
# --output text + sort で安定した順序に
PARAMS=$(aws ssm get-parameters-by-path \
  --region "$REGION" \
  --path "$PARAM_PREFIX" \
  --with-decryption \
  --query 'Parameters[*].[Name,Value]' \
  --output text)

if [ -z "$PARAMS" ]; then
  echo "ERROR: ${PARAM_PREFIX} 配下にパラメータがありません" >&2
  exit 1
fi

# 一時ファイルに書き出してから atomic move (中途半端な状態を作らない)
TMP_FILE="${OUTPUT_FILE}.tmp.$$"
trap 'rm -f "$TMP_FILE"' EXIT

{
  echo "# Auto-generated from Parameter Store at $(date)"
  echo "# Source: ${PARAM_PREFIX}/* in ${REGION}"
  echo "# 編集禁止 — load-env.sh を再実行して再生成すること"
  echo ""
  echo "$PARAMS" | while IFS=$'\t' read -r name value; do
    # /kensan/staging/SECRET_KEY → SECRET_KEY
    key="${name##*/}"
    # 改行を含む値はエスケープが必要なため、シングルクオートで囲む
    # シングルクオート自体は含まない前提 (含む場合は手動対応)
    printf "%s='%s'\n" "$key" "$value"
  done
} > "$TMP_FILE"

mv "$TMP_FILE" "$OUTPUT_FILE"
chmod 600 "$OUTPUT_FILE"

COUNT=$(grep -c "^[A-Z]" "$OUTPUT_FILE" || true)
echo "==> ${OUTPUT_FILE} に ${COUNT} 件のパラメータを書き出し (権限 600)"
echo "==> 内容確認:"
grep -E "^[A-Z]" "$OUTPUT_FILE" | sed 's/=.*/=***/' | head -20
