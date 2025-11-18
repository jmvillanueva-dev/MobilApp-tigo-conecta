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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/presentation/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Valida el campo de email
   */
  const validateFields = (): boolean => {
    if (!email) {
      setError("El email es obligatorio.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Por favor, introduce un email válido.");
      return false;
    }
    return true;
  };

  const handlePasswordReset = async () => {
    if (loading) return;
    setError(null);

    if (!validateFields()) {
      return;
    }

    setLoading(true);

    const { error } = await resetPassword(email);

    setLoading(false);

    if (error) {
      setError(error.message || "Error al enviar el correo.");
    } else {
      setIsSuccess(true);
    }
  };

  /**
   * Vista de Éxito
   */
  const renderSuccessView = () => (
    <View style={styles.successContainer}>
      <Ionicons name="mail-outline" size={80} color="#007AFF" />
      <Text style={styles.successTitle}>Correo Enviado</Text>
      <Text style={styles.successMessage}>
        Hemos enviado un correo a{"\n"}
        <Text style={{ fontWeight: "bold" }}> {email} </Text>
        {"\n"}recibirás un enlace para reestablecer tu contraseña.
      </Text>
      <Text style={styles.successSubMessage}>
        Por favor, revisa tu bandeja de entrada (y spam).
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton, { marginTop: 20 }]}
        onPress={() => router.replace("/(auth)/login")}
      >
        <Text style={styles.buttonText}>Volver a Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Vista de Formulario
   */
  const renderFormView = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#555" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Recuperar Contraseña</Text>
      <Text style={styles.subtitle}>
        Ingresa tu email y te enviaremos un enlace para reestablecer tu
        contraseña.
      </Text>

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

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handlePasswordReset}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Enviando..." : "Enviar Correo"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {isSuccess ? renderSuccessView() : renderFormView()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Reutilizamos los estilos
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 20 : 0,
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
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  form: {
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: "#007AFF", // Azul
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: "#FF3B30", // Rojo
    fontSize: 14,
    textAlign: "center",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF", // Azul
    marginTop: 20,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
  },
  successSubMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
});
