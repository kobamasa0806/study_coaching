/**
 * 学習記録の作成モーダル。
 * Web版 StudyLogPanel.tsx の入力フォーム部分を移植。
 * 日付・単元・開始/終了時刻・メモを入力し、勉強分数はリアルタイムに計算表示する。
 * 保存に成功するとガントチャートの実績セルにも即座に反映される（PlanGanttProviderで共有）。
 */
import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { usePlanGanttContext } from "@/features/plans/PlanGanttProvider";
import { calcDuration, formatMinutes, timeToMinutes, toDateInputString, toTimeString } from "@/features/studyLogs/duration";

type FieldName = "date" | "start" | "end" | null;

export default function StudyLogModalScreen() {
  const { gantt, studyLogs } = usePlanGanttContext();
  const { items } = gantt;
  const { addLog } = studyLogs;

  const [studiedOn, setStudiedOn] = useState(() => toDateInputString(new Date()));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [taskId, setTaskId] = useState(items[0]?.id ?? "");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<FieldName>(null);

  const liveDuration = calcDuration(startTime, endTime);
  const selectedTaskId = taskId || items[0]?.id || "";

  async function handleSubmit() {
    setError("");

    if (!selectedTaskId) {
      setError("記録する単元がありません。先に学習プランへ単元を追加してください。");
      return;
    }
    if (timeToMinutes(startTime) === null || timeToMinutes(endTime) === null) {
      setError("開始・終了時刻を入力してください。");
      return;
    }
    if (liveDuration === null) {
      setError("開始時刻と終了時刻が同じです。");
      return;
    }

    setIsSaving(true);
    const result = await addLog({
      task_id: selectedTaskId,
      studied_on: studiedOn,
      start_time: startTime,
      end_time: endTime,
      memo: memo.trim(),
    });
    setIsSaving(false);

    if (result === true) {
      router.back();
    } else {
      setError(result);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>日付</Text>
        <Pressable
          style={styles.input}
          onPress={() => setEditingField(editingField === "date" ? null : "date")}
        >
          <Text style={styles.inputText}>{studiedOn}</Text>
        </Pressable>
        {editingField === "date" && (
          <DateTimePicker
            mode="date"
            value={new Date(`${studiedOn}T00:00:00`)}
            onValueChange={(_, date) => {
              setStudiedOn(toDateInputString(date));
              if (Platform.OS === "android") setEditingField(null);
            }}
          />
        )}
      </View>

      <View style={styles.timeRow}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>開始</Text>
          <Pressable
            style={styles.input}
            onPress={() => setEditingField(editingField === "start" ? null : "start")}
          >
            <Text style={styles.inputText}>{startTime || "選択"}</Text>
          </Pressable>
          {editingField === "start" && (
            <DateTimePicker
              mode="time"
              value={startTime ? new Date(`2000-01-01T${startTime}:00`) : new Date()}
              onValueChange={(_, date) => {
                setStartTime(toTimeString(date));
                if (Platform.OS === "android") setEditingField(null);
              }}
            />
          )}
        </View>
        <Text style={styles.tilde}>〜</Text>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>終了</Text>
          <Pressable
            style={styles.input}
            onPress={() => setEditingField(editingField === "end" ? null : "end")}
          >
            <Text style={styles.inputText}>{endTime || "選択"}</Text>
          </Pressable>
          {editingField === "end" && (
            <DateTimePicker
              mode="time"
              value={endTime ? new Date(`2000-01-01T${endTime}:00`) : new Date()}
              onValueChange={(_, date) => {
                setEndTime(toTimeString(date));
                if (Platform.OS === "android") setEditingField(null);
              }}
            />
          )}
        </View>
      </View>

      <Text style={styles.durationText}>
        勉強時間: <Text style={styles.durationValue}>{liveDuration !== null ? formatMinutes(liveDuration) : "—"}</Text>
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>単元</Text>
        {items.length === 0 ? (
          <Text style={styles.inputText}>単元がありません</Text>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={selectedTaskId} onValueChange={(value) => setTaskId(String(value))}>
              {items.map((item) => (
                <Picker.Item key={item.id} label={item.name} value={item.id} />
              ))}
            </Picker>
          </View>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>メモ（任意）</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          placeholder="何を勉強したか"
          style={styles.input}
        />
      </View>

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      <Pressable style={[styles.submitButton, isSaving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSaving}>
        <Text style={styles.submitButtonText}>{isSaving ? "保存中..." : "記録する"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  content: { padding: 16, gap: 12 },
  field: { gap: 4 },
  flex1: { flex: 1 },
  timeRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  tilde: { paddingBottom: 10, color: "#9ca3af" },
  label: { fontSize: 12, fontWeight: "600", color: "#4b5563" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputText: { fontSize: 14, color: "#111827" },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
  },
  durationText: { fontSize: 13, color: "#6b7280" },
  durationValue: { fontWeight: "700", color: "#4f46e5" },
  error: { fontSize: 12, color: "#dc2626" },
  submitButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
});
