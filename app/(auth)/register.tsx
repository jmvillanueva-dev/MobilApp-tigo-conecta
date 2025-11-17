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

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- NUEVO ESTADO ---
  // Controla la vista de "Éxito" después del registro
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * Valida los campos del formulario
   */
  const validateFields = (): boolean => {
    if (!email || !password || !fullName || !phone) {
      setError("Todos los campos son obligatorios.");
      return false;
    }
    // Validación de Email
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Por favor, introduce un email válido.");
      return false;
    }
    // Validación de Contraseña
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    // Validación de Teléfono (simple, 9-10 dígitos)
    if (!/^[0-9]{9,10}$/.test(phone)) {
      setError("Introduce un teléfono válido (ej: 0991234567).");
      return false;
    }
    // Validación de Nombre (al menos nombre y apellido)
    if (fullName.trim().split(" ").length < 2) {
      setError("Por favor, introduce tu nombre y apellido.");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (loading) return;
    setError(null);

    // --- VALIDACIÓN MEJORADA ---
    if (!validateFields()) {
      return; // El error ya fue seteado en validateFields
    }

    setLoading(true);

    const { error } = await signUp({
      email,
      password,
      full_name: fullName,
      phone,
    });

    setLoading(false); // Detener el loading ANTES de la lógica de UI

    if (error) {
      setError(error.message || "Error al crear la cuenta.");
    } else {
      // --- MEJORA DE UX ---
      // En lugar de no hacer nada, mostramos la pantalla de éxito
      setIsSuccess(true);
    }
  };

  /**
   * Vista de Éxito
   * Se muestra después de un registro exitoso.
   */
  const renderSuccessView = () => (
    <View style={styles.successContainer}>
      <Ionicons name="checkmark-circle-outline" size={80} color="#34C759" />
      <Text style={styles.successTitle}>¡Registro Exitoso!</Text>
      <Text style={styles.successMessage}>
        Te hemos enviado un correo a{"\n"}
        <Text style={{ fontWeight: "bold" }}> {email} </Text>
        {"\n"}
        para que confirmes tu cuenta.
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
   * Vista de Formulario de Registro
   */
  const renderRegisterForm = () => (
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

      <Text style={styles.title}>Registro</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre Completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Juan Pérez"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          placeholder="0999123456"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
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
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Mostramos el formulario O la vista de éxito */}
        {isSuccess ? renderSuccessView() : renderRegisterForm()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Usamos los mismos estilos del Login para consistencia
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
    paddingHorizontal: 10,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: "#FF3B30", // Rojo
    fontSize: 14,
    textAlign: "center",
  },
  // --- NUEVOS ESTILOS PARA LA VISTA DE ÉXITO ---
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
    color: "#34C759", // Verde éxito
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
