import gspread
from google.oauth2.service_account import Credentials

# スコープ設定
scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

# 認証
creds = Credentials.from_service_account_file(
    "credentials.json",
    scopes=scopes
)

client = gspread.authorize(creds)

# スプレッドシートを開く
sheet = client.open("テスト").sheet1

# データを書き込む
sheet.append_row(["2026-03-03", "Python学習", 120])

# データを取得
data = sheet.get_all_values()
print(data)