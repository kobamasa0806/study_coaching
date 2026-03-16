"""
LINE メッセージ構築ヘルパー。
ユーザーへのリプライメッセージを組み立てる関数群。
"""
from __future__ import annotations

from linebot.v3.messaging import (
    DatetimePickerAction,
    PostbackAction,
    QuickReply,
    QuickReplyItem,
    TextMessage,
)

# Quick Reply ラベルの最大文字数（LINE 仕様: 20文字）
LABEL_MAX_LENGTH = 20
# Quick Reply アイテムの最大数（LINE 仕様: 13個）
QUICK_REPLY_MAX_ITEMS = 13


def _truncate(text: str, max_length: int = LABEL_MAX_LENGTH) -> str:
    """ラベル文字列を最大長に切り詰める。"""
    return text[:max_length] if len(text) > max_length else text


def build_not_linked_message() -> TextMessage:
    """LINE アカウント未紐付け時のメッセージを返す。"""
    return TextMessage(
        text=(
            "LINEアカウントがまだ紐付けられていません。\n\n"
            "【紐付け方法】\n"
            "1. Webアプリにログインする\n"
            "2. 設定ページで「LINE連携」ボタンを押す\n"
            "3. 表示された6桁のコードをこのチャットに送信する"
        )
    )


def build_plan_selection_message(plans: list[dict]) -> TextMessage:
    """
    学習計画選択のクイックリプライメッセージを返す。
    plans: [{"id": str, "title": str}]
    """
    if not plans:
        return TextMessage(
            text="学習計画が登録されていません。\nWebアプリから学習計画を作成してください。"
        )

    items = []
    for plan in plans[:QUICK_REPLY_MAX_ITEMS]:
        items.append(
            QuickReplyItem(
                action=PostbackAction(
                    label=_truncate(plan["title"]),
                    data=f"action=select_plan&plan_id={plan['id']}",
                    display_text=plan["title"],
                )
            )
        )

    return TextMessage(
        text="📚 どの学習計画を記録しますか？",
        quick_reply=QuickReply(items=items),
    )


def build_task_selection_message(tasks: list[dict]) -> TextMessage:
    """
    タスク選択のクイックリプライメッセージを返す。
    tasks: [{"id": str, "title": str}]
    """
    if not tasks:
        return TextMessage(
            text="この学習計画にタスクが登録されていません。\nWebアプリからタスクを追加してください。"
        )

    items = []
    for task in tasks[:QUICK_REPLY_MAX_ITEMS]:
        items.append(
            QuickReplyItem(
                action=PostbackAction(
                    label=_truncate(task["title"]),
                    data=f"action=select_task&task_id={task['id']}",
                    display_text=task["title"],
                )
            )
        )

    return TextMessage(
        text="📝 どのタスクを記録しますか？",
        quick_reply=QuickReply(items=items),
    )


def build_start_time_picker_message() -> TextMessage:
    """開始時刻を入力させる DatetimePicker メッセージを返す。"""
    return TextMessage(
        text="⏰ 学習の開始時刻を選択してください。",
        quick_reply=QuickReply(
            items=[
                QuickReplyItem(
                    action=DatetimePickerAction(
                        label="開始時刻を選択",
                        data="action=set_start_time",
                        mode="time",
                        initial="09:00",
                        min="00:00",
                        max="23:59",
                    )
                )
            ]
        ),
    )


def build_end_time_picker_message(start_time: str) -> TextMessage:
    """終了時刻を入力させる DatetimePicker メッセージを返す。"""
    return TextMessage(
        text=f"✅ 開始時刻: {start_time}\n\n⏰ 学習の終了時刻を選択してください。",
        quick_reply=QuickReply(
            items=[
                QuickReplyItem(
                    action=DatetimePickerAction(
                        label="終了時刻を選択",
                        data="action=set_end_time",
                        mode="time",
                        initial=start_time,
                        min="00:00",
                        max="23:59",
                    )
                )
            ]
        ),
    )


def build_record_saved_message(
    plan_title: str,
    task_title: str,
    study_date: str,
    start_time: str,
    end_time: str,
    duration_minutes: int,
) -> TextMessage:
    """学習記録保存完了メッセージを返す。"""
    hours, minutes = divmod(duration_minutes, 60)
    duration_text = f"{hours}時間{minutes}分" if hours > 0 else f"{minutes}分"

    return TextMessage(
        text=(
            "🎉 学習記録を保存しました！\n\n"
            f"📚 学習計画: {plan_title}\n"
            f"📝 タスク: {task_title}\n"
            f"📅 日付: {study_date}\n"
            f"⏰ {start_time} 〜 {end_time}\n"
            f"⏱️ 学習時間: {duration_text}\n\n"
            "お疲れ様でした！引き続き頑張ってください💪"
        )
    )


def build_error_message(message: str) -> TextMessage:
    """エラーメッセージを返す。"""
    return TextMessage(text=f"⚠️ {message}")


def build_help_message() -> TextMessage:
    """使い方ヘルプメッセージを返す。"""
    return TextMessage(
        text=(
            "📖 使い方\n\n"
            "【学習記録】\n"
            "「学習記録」と送信すると記録フローが始まります。\n\n"
            "【アカウント連携】\n"
            "Webアプリの設定ページで発行した6桁のコードを送信すると、"
            "アカウントを連携できます。\n\n"
            "【ヘルプ】\n"
            "「ヘルプ」と送信するとこのメッセージを表示します。"
        )
    )
