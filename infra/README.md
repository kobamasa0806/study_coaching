# インフラ設定ファイル

AWS リソース構築用の設定ファイル・スクリプト集。Console での手動構築を補助する目的。

## ディレクトリ構成

```
infra/
├── iam/                              IAM ポリシー JSON
│   ├── ec2-instance-trust-policy.json       EC2 が IAM Role を引き受けるための信頼ポリシー
│   └── ec2-instance-permissions-staging.json staging EC2 に付与する権限ポリシー
├── ec2/                              (今後追加)
│   ├── user_data.sh                  EC2 起動時の自動セットアップスクリプト
│   └── load-env.sh                   Parameter Store から .env を生成するスクリプト
├── scripts/
│   └── put-staging-parameters.sh     SSM Parameter Store 一括投入 (CloudShell で実行)
└── README.md                         このファイル
```

## IAM Role 作成手順

詳しくはチャット上の Phase 2 / Step 5 のガイド参照。

要点:
1. ロール名: `kensan-staging-ec2-role`
2. 信頼ポリシー: `iam/ec2-instance-trust-policy.json` を貼り付け
3. AWS マネージドポリシー: `AmazonSSMManagedInstanceCore` をアタッチ
4. カスタムポリシー: `iam/ec2-instance-permissions-staging.json` を貼り付け
   - ポリシー名: `kensan-staging-ec2-permissions`

## 値の差し替え

`ec2-instance-permissions-staging.json` には以下が直接記述されています。リソース変更時は更新すること。
- S3 バケット名: `ken-san-staging-bucket`
- リージョン: `ap-northeast-1`
- パス: `/kensan/staging/*` (Parameter Store)
- Cognito UserPool: `*` (将来的に特定 Pool ARN に限定するとよい)
