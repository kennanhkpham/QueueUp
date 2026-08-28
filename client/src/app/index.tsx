import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from "react-native";
import io from "socket.io-client";

// Replace with your local IP (e.g., 'http://192.168.1.10:4000') when testing on a physical mobile device
const SOCKET_URL = "http://192.168.0.181:4000";
const socket = io(SOCKET_URL);

export default function HomeScreen() {
  const [appState, setAppState] = useState<any>(null);
  const [name, setName] = useState("");
  const [skill, setSkill] = useState("Beginner");
  const [count, setCount] = useState(1);

  useEffect(() => {
    socket.on("stateUpdate", (data) => {
      setAppState(data);
    });

    return () => {
      socket.off("stateUpdate");
    };
  }, []);

  const handleJoinQueue = () => {
    if (!name.trim()) return;
    socket.emit("joinQueue", { name, skill, count: Number(count) });
    setName("");
  };

  if (!appState) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Connecting to Queue Server...</Text>
      </SafeAreaView>
    );
  }

  const { state, expiredCourts } = appState;
  const totalWaiting = state.queue.reduce(
    (acc: number, curr: any) => acc + curr.count,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>🏓 QUEUE UP</Text>

        {expiredCourts.map((courtNum: number) => (
          <View key={courtNum} style={styles.alertBanner}>
            <Text style={styles.alertText}>
              🚨 TIME'S UP ON COURT {courtNum}! Rotate players.
            </Text>
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Players Waiting</Text>
          <Text style={styles.metricText}>{totalWaiting}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Player Check-in</Text>
          <TextInput
            style={styles.input}
            placeholder="Player Name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[
                  styles.chip,
                  skill === lvl && styles.activeChip,
                ]}
                onPress={() => setSkill(lvl)}
              >
                <Text
                  style={
                    skill === lvl ? styles.activeChipText : styles.chipText
                  }
                >
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleJoinQueue}>
            <Text style={styles.buttonText}>Join Queue</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Active Courts</Text>
        {Object.keys(state.courts).map((courtNum) => {
          const group = state.courts[courtNum];
          return (
            <View key={courtNum} style={styles.card}>
              <Text style={styles.courtTitle}>Court {courtNum}</Text>
              {group.length > 0 ? (
                <>
                  <Text style={styles.subtext}>Skill: {group[0].skill}</Text>
                  {group.map((p: any, idx: number) => (
                    <Text key={idx} style={styles.playerText}>
                      • {p.name} ({p.count === 1 ? "Solo" : `Group of ${p.count}`})
                    </Text>
                  ))}
                  <TouchableOpacity
                    style={[styles.button, styles.dangerButton]}
                    onPress={() => socket.emit("finishMatch", courtNum)}
                  >
                    <Text style={styles.buttonText}>Finish Match</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.subtext}>Status: Empty</Text>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => socket.emit("fillCourt", courtNum)}
                  >
                    <Text style={styles.buttonText}>Fill Court</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f5" },
  scrollContent: { padding: 16 },
  loading: { fontSize: 18, textAlign: "center", marginTop: 40, color: "#374151" },
  header: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 16, color: "#111827" },
  sectionHeader: { fontSize: 22, fontWeight: "bold", marginVertical: 12, color: "#111827" },
  alertBanner: { backgroundColor: "#ef4444", padding: 12, borderRadius: 8, marginBottom: 12 },
  alertText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 10, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#1f2937" },
  courtTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  metricText: { fontSize: 32, fontWeight: "bold", color: "#2563eb" },
  subtext: { color: "#6b7280", marginBottom: 8 },
  playerText: { fontSize: 16, marginVertical: 2, color: "#374151" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, marginBottom: 12, color: "#111827" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  chip: { padding: 8, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, flex: 1, marginHorizontal: 2, alignItems: "center" },
  activeChip: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { color: "#374151", fontSize: 12 },
  activeChipText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  button: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8, marginTop: 8 },
  dangerButton: { backgroundColor: "#dc2626" },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});