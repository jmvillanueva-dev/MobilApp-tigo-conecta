import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PlanMovil } from "../../src/domain/entities/Plan";
import { PlanRepository } from "../../src/domain/repositories/PlanRepository";
import { SupabasePlanRepository } from "../../src/data/repositories/SupabasePlanRepository";
import { LinearGradient } from "expo-linear-gradient";

export default function PlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [plan, setPlan] = useState<PlanMovil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const planRepository: PlanRepository = new SupabasePlanRepository();

  useEffect(() => {
    if (!id) {
      setError("No se proporcionó un ID de plan.");
      setLoading(false);
      return;
    }

    const fetchPlan = async () => {
      setLoading(true);
      const { plan, error } = await planRepository.getPlanById(id);
      if (error) {
        setError(error.message || "No se pudo cargar el plan.");
      } else if (plan) {
        setPlan(plan);
      } else {
        setError("Plan no encontrado.");
      }
      setLoading(false);
    };

    fetchPlan();
  }, [id]);

  // Función para capitalizar y formatear las llaves del JSON
  const formatKey = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Renderiza el contenido principal
  const renderPlanDetails = () => {
    if (!plan) return null;

    const gradientColors: [string, string] = plan.imagen_url
      ? ["transparent", "rgba(0,0,0,0.8)"]
      : ["#6E86FF", "#4A6BFF"];

    return (
      <>
        {/* --- Encabezado con Imagen/Gradiente --- */}
        <ImageBackground
          source={plan.imagen_url ? { uri: plan.imagen_url } : undefined}
          style={styles.headerImage}
        >
          {/* Usamos el gradiente como fondo si no hay imagen, o como overlay si sí hay */}
          <LinearGradient colors={gradientColors} style={styles.headerOverlay}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={styles.planName}>{plan.nombre}</Text>
              <Text style={styles.planPrice}>
                ${plan.precio}
                <Text style={styles.priceSuffix}>/mes</Text>
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* --- Contenido de Detalles --- */}
        <ScrollView style={styles.detailsContainer}>
          {plan.promocion && (
            <View style={styles.promoBadge}>
              <Ionicons name="sparkles-outline" size={16} color="#007AFF" />
              <Text style={styles.promoText}>{plan.promocion}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Segmento</Text>
              <Text style={styles.infoValue}>{plan.segmento}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Público Objetivo</Text>
              <Text style={styles.infoValue}>{plan.publico_objetivo}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Características Técnicas</Text>
            {/* Mapeamos dinámicamente el JSON 'detalles_tecnicos' */}
            {plan.detalles_tecnicos &&
              Object.entries(plan.detalles_tecnicos).map(([key, value]) => (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{formatKey(key)}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
          </View>
        </ScrollView>

        {/* --- Footer con Botón --- */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.contratarButton}
            onPress={() => router.replace("/(auth)/login")} // El invitado va al login
          >
            <Text style={styles.contratarButtonText}>
              Iniciar Sesión para Contratar
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      {loading && (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={styles.loading}
        />
      )}
      {error && !loading && (
        <View style={styles.loading}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButtonError}
          >
            <Ionicons name="arrow-back" size={18} color="#007AFF" />
            <Text style={styles.backButtonErrorText}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}
      {!loading && !error && plan && renderPlanDetails()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  errorText: { color: "#FF3B30", fontSize: 16, marginBottom: 20 },
  backButtonError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
  },
  backButtonErrorText: { color: "#007AFF", fontSize: 16 },

  headerImage: {
    height: 300,
    width: "100%",
    backgroundColor: "#6E86FF",
  },
  headerOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
    paddingTop: StatusBar.currentHeight || 40,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 100,
    padding: 8,
  },
  headerInfo: {
    paddingBottom: 10,
  },
  planName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  priceSuffix: {
    fontSize: 16,
    fontWeight: "normal",
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
  },
  promoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E6F2FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  promoText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    flex: 1, // Ocupa la mitad
  },
  infoValue: {
    fontSize: 15,
    color: "#111",
    fontWeight: "500",
    flex: 1, // Ocupa la mitad
    textAlign: "right",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    backgroundColor: "#FFFFFF",
  },
  contratarButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  contratarButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
