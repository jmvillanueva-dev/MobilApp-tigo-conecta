import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useAuth } from "../../src/presentation/contexts/AuthContext";
import { useRouter } from "expo-router";

/**
 * Pantalla de Inicio (Temporal)
 * Sirve para probar el flujo de autenticación y el botón de SignOut.
 */
export default function HomeScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    // El RootLayout se encargará de redirigir a '/'
    router.replace("/(auth)/login"); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>¡Bienvenido!</Text>
        <Text style={styles.subtitle}>
          Esta es la pantalla de inicio temporal.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Datos de Sesión</Text>
          <Text style={styles.infoLabel}>Nombre:</Text>
          <Text style={styles.infoText}>{profile?.full_name}</Text>

          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoText}>{user?.email}</Text>

          <Text style={styles.infoLabel}>Teléfono:</Text>
          <Text style={styles.infoText}>{profile?.phone}</Text>

          <Text style={styles.infoLabel}>User ID:</Text>
          <Text style={styles.infoText}>{user?.id}</Text>

          <Text style={styles.infoLabel}>Rol:</Text>
          <Text style={styles.infoText}>{profile?.rol}</Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  container: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0D47A1",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 10,
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: "#888",
    marginTop: 10,
  },
  infoText: {
    fontSize: 16,
    color: "#111",
    fontWeight: "500",
  },
  signOutButton: {
    backgroundColor: "#FF3B30", // Rojo
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
