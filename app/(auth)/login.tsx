import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/presentation/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Valida los campos del formulario
   */
  const validateFields = (): boolean => {
    if (!email || !password) {
      setError("Email y contraseña son obligatorios.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Por favor, introduce un email válido.");
      return false;
    }
    return true;
  };

  /**
   * Traduce errores de Supabase a mensajes amigables
   */
  const getFriendlyErrorMessage = (errorMessage: string): string => {
    const lowerCaseError = errorMessage.toLowerCase();

    if (lowerCaseError.includes("invalid login credentials")) {
      return "Email o contraseña incorrectos. Por favor, verifica tus datos.";
    }
    if (lowerCaseError.includes("email not confirmed")) {
      return "Tu cuenta aún no está confirmada. Revisa tu email para activar tu cuenta.";
    }

    // Fallback para otros errores
    return "Error al iniciar sesión. Inténtalo de nuevo más tarde.";
  };

  const handleSignIn = async () => {
    if (loading) return;
    setError(null);

    // --- 1. VALIDACIÓN DE CLIENTE ---
    if (!validateFields()) {
      return;
    }

    setLoading(true);

    const { error } = await signIn({ email, password });

    if (error) {
      // --- 2. MANEJO DE ERRORES AMIGABLE ---
      setError(getFriendlyErrorMessage(error.message));
    } else {
      // El AuthContext y el RootLayout se encargarán de la redirección
      // No necesitamos hacer router.replace() aquí
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#555" />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Iniciar Sesión</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Ingresando..." : "Ingresar como Usuario"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Ingresando..." : "Ingresar como Asesor"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => router.push("/(auth)/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, padding: 24, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: -8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  button: {
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF", // Azul
  },
  secondaryButton: {
    backgroundColor: "#34C759", // Verde
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  forgotPasswordButton: {
    marginTop: 8,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#007AFF",
    fontSize: 15,
  },
  errorText: {
    color: "#FF3B30", // Rojo
    fontSize: 14,
    textAlign: "center",
  },
});
