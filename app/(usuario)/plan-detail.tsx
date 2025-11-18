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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { PlanMovil } from "../../src/domain/entities/Plan";
import { PlanRepository } from "../../src/domain/repositories/PlanRepository";
import { SupabasePlanRepository } from "../../src/data/repositories/SupabasePlanRepository";

export default function PlanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [plan, setPlan] = useState<PlanMovil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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

  // Función para capitalizar claves del JSON (ej: datos_moviles -> Datos Moviles)
  const formatKey = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleContratar = () => {
    // Aquí conectaremos con la Base de Datos en el siguiente paso
    Alert.alert(
      "Confirmar Contratación",
      `¿Estás seguro de que deseas contratar el plan ${plan?.nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, Contratar",
          onPress: () => {
            // Simulación por ahora
            setProcessing(true);
            setTimeout(() => {
              setProcessing(false);
              Alert.alert(
                "Solicitud Enviada",
                "En el próximo paso implementaremos el guardado en la base de datos."
              );
              router.back();
            }, 1500);
          },
        },
      ]
    );
  };

  const renderPlanDetails = () => {
    if (!plan) return null;

    const gradientColors: [string, string] = plan.imagen_url
      ? ["transparent", "rgba(0,0,0,0.8)"]
      : ["#6E86FF", "#4A6BFF"];

    return (
      <>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* --- Encabezado --- */}
          <ImageBackground
            source={plan.imagen_url ? { uri: plan.imagen_url } : undefined}
            style={styles.headerImage}
          >
            <LinearGradient
              colors={gradientColors}
              style={styles.headerOverlay}
            >
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

          {/* --- Contenido --- */}
          <View style={styles.detailsContainer}>
            {plan.promocion && (
              <View style={styles.promoBadge}>
                <Ionicons name="sparkles-outline" size={16} color="#007AFF" />
                <Text style={styles.promoText}>{plan.promocion}</Text>
              </View>
            )}

            <Text style={styles.description}>{plan.descripcion_corta}</Text>

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
              {plan.detalles_tecnicos &&
                Object.entries(plan.detalles_tecnicos).map(([key, value]) => (
                  <View key={key} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{formatKey(key)}</Text>
                    <Text style={styles.infoValue}>{value}</Text>
                  </View>
                ))}
            </View>
          </View>
        </ScrollView>

        {/* --- Footer Fijo --- */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.contratarButton,
              processing && styles.disabledButton,
            ]}
            onPress={handleContratar}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.contratarButtonText}>Contratar Plan</Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" />
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      {error && !loading && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButtonError}
          >
            <Text style={{ color: "#007AFF" }}>Volver</Text>
          </TouchableOpacity>
        </View>
      )}
      {!loading && !error && plan && renderPlanDetails()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  headerImage: { height: 300, width: "100%", backgroundColor: "#6E86FF" },
  headerOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 100,
    padding: 8,
  },
  headerInfo: { paddingBottom: 10 },
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
  priceSuffix: { fontSize: 16, fontWeight: "normal" },

  detailsContainer: { padding: 20 },
  promoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E6F2FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  promoText: { color: "#007AFF", fontSize: 14, fontWeight: "bold" },
  description: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 24,
  },

  section: { marginBottom: 24 },
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
    borderBottomColor: "#F9F9F9",
  },
  infoLabel: { fontSize: 15, color: "#666", flex: 1 },
  infoValue: {
    fontSize: 15,
    color: "#111",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    backgroundColor: "#FFFFFF",
    paddingBottom: 30,
  },
  contratarButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: { opacity: 0.7 },
  contratarButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  errorText: { color: "#FF3B30", marginBottom: 10 },
  backButtonError: { padding: 10 },
});
