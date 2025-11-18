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
  onPress: () => void;
  gradientColors?: string[];
}

// Colores de gradiente por defecto
const defaultGradients: Record<string, GradientColors> = {
  default: ["#6E86FF", "#4A6BFF"], // Azul
  smart: ["#6E86FF", "#4A6BFF"], // Azul
  premium: ["#FF68B8", "#FF4F81"], // Rosa/Rojo
  ilimitado: ["#3ec8aaff", "#21a98cff"], // Turquesa
};

// Función simple para elegir el gradiente
const getGradient = (planName: string): GradientColors => {
  const normalizedName = planName.toLowerCase();

  if (normalizedName.includes("ilimitado")) {
    return defaultGradients.ilimitado;
  }

  if (normalizedName.includes("premium")) {
    return defaultGradients.premium;
  }

  if (normalizedName.includes("smart")) {
    return defaultGradients.smart;
  }

  return defaultGradients.default;
};

export function PlanCard({ plan, onPress }: PlanCardProps) {
  const gradientColors = getGradient(plan.nombre);

  const gigas = plan.gigas_num ? `${plan.gigas_num} GB` : "Ilimitado";
  const minutos = plan.minutos_num ? `${plan.minutos_num} min` : "Ilimitado";

  return (
    <View style={styles.cardContainer}>
      {/* --- INICIO: FONDO CONDICIONAL --- */}
      {plan.imagen_url ? (
        // Caso 1: Hay imagen, la usamos de fondo
        <ImageBackground
          source={{ uri: plan.imagen_url }}
          style={styles.gradientBackground}
          imageStyle={styles.imageStyle}
        >
          {/* Añadimos un overlay oscuro para legibilidad */}
          <View style={styles.imageOverlay} />
        </ImageBackground>
      ) : (
        // Caso 2: No hay imagen, usamos el gradiente de color
        <LinearGradient
          colors={gradientColors}
          style={styles.gradientBackground}
        />
      )}
      {/* --- FIN: FONDO CONDICIONAL --- */}

      {/* Contenido (se renderiza encima del fondo) */}
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

        <Text style={styles.description}>{plan.descripcion_corta}</Text>

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

        <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
          <Text style={styles.detailsButtonText}>Ver Detalles</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: "hidden", // Importante
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: "#667eea",
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  imageStyle: {
    borderRadius: 16,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 16,
  },
  contentContainer: {
    padding: 20,
    // Importante: zIndex asegura que el contenido esté sobre el fondo
    // (Aunque por orden de renderizado ya debería estarlo)
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
  promoText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  description: {
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 16,
  },
  features: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  detailsButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
