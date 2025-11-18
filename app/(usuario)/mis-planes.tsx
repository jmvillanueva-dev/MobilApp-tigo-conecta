import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/presentation/contexts/AuthContext";

export default function MisPlanesScreen() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  // Validación de sesión - redirige inmediatamente si no hay sesión
  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/(auth)/login");
    }
  }, [session, isLoading, router]);

  // Si no hay sesión válida, mostrar loading mientras se redirige
  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla Mis Planes</Text>
      <Text>Aquí irá el historial de contrataciones.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  text: { fontSize: 18, fontWeight: "bold" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
});
