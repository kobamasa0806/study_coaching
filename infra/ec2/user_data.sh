#!/bin/bash
# kensan staging EC2 (Amazon Linux 2023 ARM/Graviton) 用 user_data
# EC2 起動時に1回だけ実行される。Docker / docker-compose / git / certbot などを準備する。
#
# 動作確認は EC2 起動後にログでチェック:
#   /var/log/cloud-init-output.log
#   sudo tail -f /var/log/cloud-init-output.log

set -euo pipefail
exec > >(tee -a /var/log/user-data.log) 2>&1

echo "==> [$(date)] user_data 開始"

# --- 1. システム更新 ---
echo "==> 1. dnf update"
dnf update -y

# --- 2. swap 追加 (t4g.nano は RAM 0.5GB なので必須) ---
# 1GB swap を /swapfile に作成
echo "==> 2. swap 1GB 作成"
if [ ! -f /swapfile ]; then
  dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# --- 3. Docker インストール ---
echo "==> 3. Docker インストール"
dnf install -y docker
systemctl enable --now docker

# ec2-user を docker グループに追加 (sudo 不要で docker が使えるように)
usermod -aG docker ec2-user
# SSM Session Manager で入る ssm-user も同様に
if id ssm-user &>/dev/null; then
  usermod -aG docker ssm-user
fi

# --- 4. docker-compose v2 plugin インストール ---
echo "==> 4. docker compose plugin インストール"
DOCKER_CONFIG=/usr/local/lib/docker
mkdir -p $DOCKER_CONFIG/cli-plugins
COMPOSE_VERSION="v2.32.4"
curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-aarch64" \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# --- 5. git インストール ---
echo "==> 5. git インストール"
dnf install -y git

# --- 6. certbot (Let's Encrypt) インストール ---
# Phase 2 / Step 11 で TLS 取得時に使用
echo "==> 6. certbot インストール"
dnf install -y python3-pip
pip3 install certbot

# --- 7. SSM Agent (Amazon Linux 2023 にはプリインストール済み) ---
# 念のため起動確認
echo "==> 7. SSM Agent 起動確認"
systemctl enable --now amazon-ssm-agent

# --- 8. アプリ配置ディレクトリ作成 ---
echo "==> 8. /opt/kensan 作成"
mkdir -p /opt/kensan
chown ec2-user:ec2-user /opt/kensan

# --- 9. timezone を JST に ---
echo "==> 9. timezone Asia/Tokyo"
timedatectl set-timezone Asia/Tokyo

# --- 10. CloudWatch Logs 用エージェント (将来用にコメントアウト) ---
# dnf install -y amazon-cloudwatch-agent

echo "==> [$(date)] user_data 完了"
echo "==> 次のステップ: SSM Session Manager で接続して /opt/kensan にアプリを配置"
