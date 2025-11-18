import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/presentation/contexts/AuthContext";

export default function PerfilScreen() {
  const {
    user,
    profile,
    signOut,
    updateProfileData,
    updateAuthEmail,
    isLoading: isAuthLoading,
  } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos del formulario
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Inicializa los campos del formulario cuando el perfil se carga
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
    if (user) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleSignOut = async () => {
    await signOut();
    // El RootLayout se encargará de redirigir
    router.replace("/(auth)/login");
  };

  const onEditPress = () => {
    setIsEditing(true);
  };

  const onCancelPress = () => {
    // Resetea los campos a los valores originales
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
    if (user) {
      setEmail(user.email || "");
    }
    setError(null);
    setIsEditing(false);
  };

  const onSavePress = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    let hasError = false;
    let profileUpdated = false;
    let emailUpdated = false;

    // 1. Validar campos
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setError("Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }

    try {
      // 2. Actualizar datos del perfil (Nombre, Teléfono)
      if (fullName !== profile?.full_name || phone !== profile?.phone) {
        const { error: profileError } = await updateProfileData({
          full_name: fullName,
          phone: phone,
        });
        if (profileError) {
          throw new Error(
            profileError.message || "Error al actualizar el perfil."
          );
        }
        profileUpdated = true;
      }

      // 3. Actualizar email (si cambió)
      if (email !== user?.email) {
        const { error: emailError } = await updateAuthEmail(email);
        if (emailError) {
          throw new Error(
            emailError.message || "Error al actualizar el email."
          );
        } else {
          emailUpdated = true;
          // Informar al usuario que debe confirmar el email
          Alert.alert(
            "Revisa tu correo",
            "Hemos enviado un enlace de confirmación a tu nuevo email."
          );
        }
      }

      // 4. Mostrar notificación de éxito
      if (profileUpdated || emailUpdated) {
        let successMessage = "Perfil actualizado correctamente";
        if (profileUpdated && emailUpdated) {
          successMessage = "Perfil y email actualizados correctamente";
        } else if (emailUpdated) {
          successMessage = "Email actualizado correctamente";
        }

        Alert.alert("¡Éxito!", successMessage, [
          { text: "OK", style: "default" },
        ]);
      }
    } catch (e: any) {
      setError(e.message);
      hasError = true;

      // Mostrar notificación de error
      Alert.alert(
        "Error",
        e.message ||
          "Hubo un problema al actualizar tu perfil. Por favor, intenta nuevamente.",
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setLoading(false);
      if (!hasError) {
        setIsEditing(false); // Salir del modo edición solo si todo fue exitoso
      }
    }
  };

  if (isAuthLoading || !profile || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Obtener la inicial del usuario
  const userInitial = profile.full_name
    ? profile.full_name[0].toUpperCase()
    : "U";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          {/* --- Avatar y Nombre --- */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <Text style={styles.userName}>{profile.full_name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          {/* --- Campos de Datos --- */}
          <View style={styles.infoContainer}>
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={email}
              isEditing={isEditing}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <InfoRow
              icon="call-outline"
              label="Teléfono"
              value={phone}
              isEditing={isEditing}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <InfoRow
              icon="person-outline"
              label="Nombre Completo"
              value={fullName}
              isEditing={isEditing}
              onChangeText={setFullName}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* --- Botones de Acción --- */}
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={onSavePress}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>Guardar Cambios</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancelPress}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.editButton]}
                  onPress={onEditPress}
                >
                  <Text style={styles.buttonText}>Editar Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.logoutButton]}
                  onPress={handleSignOut}
                >
                  <Text style={styles.buttonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Componente helper para las filas de información
const InfoRow = ({
  icon,
  label,
  value,
  isEditing,
  onChangeText,
  keyboardType = "default",
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  isEditing: boolean;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
}) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={24} color="#8E8E93" style={styles.infoIcon} />
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      ) : (
        <Text style={styles.infoValue}>{value}</Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2F2F7" },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
  },
  userEmail: {
    fontSize: 16,
    color: "#8E8E93",
  },
  infoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  infoIcon: {
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  infoValue: {
    fontSize: 16,
    color: "#111",
    marginTop: 2,
  },
  input: {
    fontSize: 16,
    color: "#111",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#007AFF",
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#007AFF", // Azul
  },
  logoutButton: {
    backgroundColor: "#FF3B30", // Rojo
  },
  saveButton: {
    backgroundColor: "#34C759", // Verde
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#8E8E93",
  },
  cancelButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 16,
  },
});
