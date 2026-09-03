import { Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";

export default function LoginScreen() {
  const { login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await login();
    } catch {
      setError("ログインに失敗しました。もう一度お試しください。");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ケンサン</Text>
      <Text style={styles.subtitle}>学習プランで資格合格を目指す</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleLogin} disabled={isLoggingIn}>
        <Text style={styles.buttonText}>{isLoggingIn ? "ログイン中..." : "ログイン"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 24 },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 8 },
  button: { backgroundColor: "#4f46e5", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
