from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def get_sheets_service():
    creds = service_account.Credentials.from_service_account_file(
        "service_account.json",
        scopes=SCOPES,
    )
    return build("sheets", "v4", credentials=creds)

def create_spreadsheet(title: str):
    service = get_sheets_service()

    spreadsheet = {
        "properties": {
            "title": title
        }
    }

    result = service.spreadsheets().create(
        body=spreadsheet,
        fields="spreadsheetId,spreadsheetUrl"
    ).execute()

    return result["spreadsheetId"], result["spreadsheetUrl"]

def add_sheets(spreadsheet_id: str):
    service = get_sheets_service()

    requests = []
    for name in ["Plan", "DailyLog", "Master", "Guide"]:
        requests.append({
            "addSheet": {
                "properties": {
                    "title": name
                }
            }
        })

    service.spreadsheets().batchUpdate(
        spreadsheetId=spreadsheet_id,
        body={"requests": requests}
    ).execute()

def write_plan_header(spreadsheet_id: str):
    service = get_sheets_service()

    headers = [[
        "user_id", "task_id", "task_name",
        "start_date", "end_date",
        "planned_minutes", "category",
        "priority", "status", "note"
    ]]

    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Plan!A1:J1",
        valueInputOption="RAW",
        body={"values": headers}
    ).execute()

def write_master(spreadsheet_id: str, categories, books):
    service = get_sheets_service()

    values = [["category_id", "category_name"]]
    for c in categories:
        values.append([c.id, c.name])

    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Master!A1:B",
        valueInputOption="RAW",
        body={"values": values}
    ).execute()

def apply_category_validation(spreadsheet_id: str):
    service = get_sheets_service()

    request = {
        "setDataValidation": {
            "range": {
                "sheetId": 0,  # PlanのsheetId（実際は取得する）
                "startRowIndex": 1,
                "startColumnIndex": 6,
                "endColumnIndex": 7,
            },
            "rule": {
                "condition": {
                    "type": "ONE_OF_RANGE",
                    "values": [{
                        "userEnteredValue": "Master!B2:B"
                    }]
                },
                "strict": True,
                "showCustomUi": True
            }
        }
    }

    service.spreadsheets().batchUpdate(
        spreadsheetId=spreadsheet_id,
        body={"requests": [request]}
    ).execute()

def write_guide(spreadsheet_id: str):
    service = get_sheets_service()

    guide = [[
        "① Planは計画のみ入力",
        "② DailyLogは実績のみ",
        "③ 列は消さない",
        "④ 困ったら触らない"
    ]]

    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Guide!A1:D1",
        valueInputOption="RAW",
        body={"values": guide}
    ).execute()



def create_full_sheet(user_id: str):
    title = f"学習進捗管理_{user_id}"

    spreadsheet_id, url = create_spreadsheet(title)
    add_sheets(spreadsheet_id)
    write_plan_header(spreadsheet_id)
    write_master(spreadsheet_id, categories=[], books=[])
    write_guide(spreadsheet_id)

    return {
        "spreadsheet_id": spreadsheet_id,
        "spreadsheet_url": url
    }