import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { PlanMovil } from "../../domain/entities/Plan";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type GradientColors = [string, string, ...string[]];

interface PlanCardProps {
  plan: PlanMovil;
  onPress: () => void; // Acción general (o Ver Detalles)
  onContract?: () => void; // Acción específica Contratar
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const defaultGradients: Record<string, GradientColors> = {
  default: ["#6E86FF", "#4A6BFF"],
  smart: ["#6E86FF", "#4A6BFF"],
  premium: ["#FF68B8", "#FF4F81"],
  ilimitado: ["#3ec8aaff", "#21a98cff"],
};

const getGradient = (planName: string): GradientColors => {
  const normalizedName = planName.toLowerCase();
  if (normalizedName.includes("ilimitado")) return defaultGradients.ilimitado;
  if (normalizedName.includes("premium")) return defaultGradients.premium;
  if (normalizedName.includes("smart")) return defaultGradients.smart;
  return defaultGradients.default;
};

export function PlanCard({
  plan,
  onPress,
  onContract,
  isAdmin,
  onEdit,
  onDelete,
}: PlanCardProps) {
  const gradientColors = getGradient(plan.nombre);
  const gigas = plan.gigas_num ? `${plan.gigas_num} GB` : "Ilimitado";
  const minutos = plan.minutos_num ? `${plan.minutos_num} min` : "Ilimitado";

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={{ flex: 1 }}
      >
        {plan.imagen_url ? (
          <ImageBackground
            source={{ uri: plan.imagen_url }}
            style={styles.gradientBackground}
            imageStyle={styles.imageStyle}
          >
            <View style={styles.imageOverlay} />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={gradientColors}
            style={styles.gradientBackground}
          />
        )}

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.planName}>{plan.nombre}</Text>
            <Text style={styles.planPrice}>${plan.precio}</Text>
          </View>

          {plan.promocion && (
            <View style={styles.promoBadge}>
              <Text style={styles.promoText}>{plan.promocion}</Text>
            </View>
          )}

          <Text style={styles.description} numberOfLines={2}>
            {plan.descripcion_corta}
          </Text>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name="phone-portrait-outline" size={16} color="#FFF" />
              <Text style={styles.featureText}>{gigas}</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="call-outline" size={16} color="#FFF" />
              <Text style={styles.featureText}>{minutos}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* --- SECCIÓN DE USUARIO (BOTONES DETALLES/CONTRATAR) --- */}
      {!isAdmin && (
        <View style={styles.userActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.detailsButton]}
            onPress={onPress}
          >
            <Text style={styles.detailsButtonText}>Ver Detalles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.contractButton]}
            onPress={onContract || onPress}
          >
            <Text style={styles.contractButtonText}>Contratar</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* --- SECCIÓN DE ADMIN (BOTONES EDITAR/ELIMINAR) --- */}
      {isAdmin && (
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={[styles.adminButton, styles.editButton]}
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={20} color="#34C759" />
            <Text style={styles.adminButtonTextEdit}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.adminButton, styles.deleteButton]}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={styles.adminButtonTextDelete}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "#fff",
    minHeight: 200,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    height: "100%",
  },
  imageStyle: { borderRadius: 16 },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 31, 38, 0.75)",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 10,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  planName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 10,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  promoBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  promoText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  description: { color: "#FFFFFF", fontSize: 14, marginBottom: 16 },
  features: { flexDirection: "row", gap: 20, marginBottom: 10 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  featureText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },

  // --- Estilos Usuario ---
  userActions: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  detailsButton: {
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  detailsButtonText: { color: "#007AFF", fontSize: 14, fontWeight: "600" },
  contractButton: {
    backgroundColor: "#007AFF",
  },
  contractButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },

  // --- Estilos Admin ---
  adminActions: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  adminButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  editButton: { backgroundColor: "#FFF" },
  deleteButton: { backgroundColor: "#FFF" },
  adminButtonTextEdit: { color: "#34C759", fontWeight: "bold", fontSize: 15 },
  adminButtonTextDelete: { color: "#FF3B30", fontWeight: "bold", fontSize: 15 },
});
