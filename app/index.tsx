import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

/**
 * Pantalla de Bienvenida (index)
 * Coincide con la primera captura de pantalla.
 */
export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>BIENVENIDO a Tigo</Text>
          <Text style={styles.subtitle}>Descubre nuestros planes móviles</Text>
        </View>

        <View style={styles.buttonContainer}>
          {/* 1. Explorar como Invitado */}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push("/(guest)/explore" as any)} // Navega al layout de invitado
          >
            <Text style={styles.primaryButtonText}>Explorar como Invitado</Text>
          </TouchableOpacity>

          {/* 2. Iniciar Sesión */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push("/(auth)/login")} // Navega a la pantalla de login
          >
            <Text style={styles.secondaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          {/* 3. Registrarse */}
          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={() => router.push("/(auth)/register")} // Navega a la pantalla de registro
          >
            <Text style={styles.tertiaryButtonText}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between", // Empuja el header arriba y botones abajo
  },
  header: {
    paddingTop: "30%", // Da espacio superior
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0D47A1", // Azul Tigo
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
  },
  buttonContainer: {
    paddingBottom: 20,
    gap: 16, // Espacio entre botones
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF", // Azul primario
    borderColor: "#007AFF",
    borderWidth: 1,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: "#007AFF", // Mismo azul
    fontSize: 16,
    fontWeight: "600",
  },
  tertiaryButton: {
    backgroundColor: "#F2F2F7", // Gris claro
  },
  tertiaryButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
});
