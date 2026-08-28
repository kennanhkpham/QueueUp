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

// Replace with your local machine IP address for physical mobile testing (e.g., 'http://192.168.1.10:4000')
const SOCKET_URL = "http://localhost:4000";
const socket = io(SOCKET_URL);

export default function App() {
  const [appState, setAppState] = useState(null);
  const [name, setName] = useState("");
  const [skill, setSkill] = useState("Beginner");
  const [count, setCount] = useState(1);

  useEffect(() => {
    // Listen for state updates from Node.js server
    socket.on("stateUpdate", (data) => {
      setAppState(data);
    });

    return () => socket.off("stateUpdate");
  }, []);

  const handleJoinQueue = () => {
    if (!name.trim()) return;
    socket.emit("joinQueue", { name, skill, count: parseInt(count) });
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
  const totalWaiting = state.queue.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.header}>🏓 QUEUE UP</Text>

        {/* Expired Timers Banner */}
        {expiredCourts.map((courtNum) => (
          <View key={courtNum} style={styles.alertBanner}>
            <Text style={styles.alertText}>
              🚨 TIME'S UP ON COURT {courtNum}! Rotate players.
            </Text>
          </View>
        ))}

        {/* Total Waiting Metric */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Players Waiting</Text>
          <Text style={styles.metricText}>{totalWaiting}</Text>
        </View>

        {/* Player Check-in Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Player Check-in</Text>
          <TextInput
            style={styles.input}
            placeholder="Player Name"
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

        {/* Active Courts */}
        <Text style={styles.sectionHeader}>Active Courts</Text>
        {Object.keys(state.courts).map((courtNum) => {
          const group = state.courts[courtNum];
          return (
            <View key={courtNum} style={styles.card}>
              <Text style={styles.courtTitle}>Court {courtNum}</Text>
              {group.length > 0 ? (
                <>
                  <Text style={styles.subtext}>Skill: {group[0].skill}</Text>
                  {group.map((p, idx) => (
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
  loading: { fontSize: 18, textAlign: "center", marginTop: 40 },
  header: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  sectionHeader: { fontSize: 22, fontWeight: "bold", marginVertical: 12 },
  alertBanner: { backgroundColor: "#ef4444", padding: 12, borderRadius: 8, marginBottom: 12 },
  alertText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 10, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  courtTitle: { fontSize: 20, fontWeight: "bold" },
  metricText: { fontSize: 32, fontWeight: "bold", color: "#2563eb" },
  subtext: { color: "#6b7280", marginBottom: 8 },
  playerText: { fontSize: 16, marginVertical: 2 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  chip: { padding: 8, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6 },
  activeChip: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { color: "#374151" },
  activeChipText: { color: "#fff", fontWeight: "bold" },
  button: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8, marginTop: 8 },
  dangerButton: { backgroundColor: "#dc2626" },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});