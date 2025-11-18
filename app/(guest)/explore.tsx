import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SupabasePlanRepository } from "../../src/data/repositories/SupabasePlanRepository";
import { PlanMovil } from "../../src/domain/entities/Plan";
import { PlanRepository } from "../../src/domain/repositories/PlanRepository";
import { PlanCard } from "../../src/presentation/components/PlanCard";

export default function ExploreScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanMovil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      // Instanciamos el repositorio dentro del effect
      const planRepository: PlanRepository = new SupabasePlanRepository();
      const { plans, error } = await planRepository.getActivePlans();
      if (error) {
        setError(error.message || "No se pudieron cargar los planes.");
      } else {
        setPlans(plans || []);
      }
      setLoading(false);
    };

    fetchPlans();
  }, []);

  const renderHeader = () => (
    <View>
      {/* Header con logo y botón de login */}
      <View style={styles.header}>
        {/* Fila superior con navegación y logo */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#0D47A1" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Tigo Conecta</Text>
            <View style={styles.logoAccent} />
          </View>

          <View style={styles.placeholder} />
        </View>

        {/* Sección de llamada a la acción */}
        <View style={styles.ctaContainer}>
          <View style={styles.ctaTextContainer}>
            <Text style={styles.ctaTitle}>¡Descubre tu plan ideal!</Text>
            <Text style={styles.ctaSubtitle}>
              Contrata ahora y obtén beneficios exclusivos
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Iniciar Sesión</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Nuevos Planes Tigo</Text>
        <Text style={styles.bannerSubtitle}>
          Los mejores planes del mercado
        </Text>
      </View>

      {/* Barra de Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#8E8E93"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar planes..."
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>

      {/* Título de la lista */}
      <View style={styles.planListContainer}>
        <Text style={styles.planListTitle}>Planes Disponibles</Text>
      </View>
    </View>
  );

  const renderLoadingOrError = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 50 }}
          />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    return null;
  };

  if (loading || error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          {renderHeader()}
          {renderLoadingOrError()}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        style={styles.container}
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.planCardContainer}>
            <PlanCard
              plan={item}
              onPress={() => {
                router.push({
                  pathname: "/(guest)/plan-detail",
                  params: { id: item.id },
                });
              }}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2F2F7" },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: "#007AFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoContainer: {
    alignItems: "center",
    flex: 1,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  logoAccent: {
    width: 30,
    height: 3,
    backgroundColor: "#FFF",
    borderRadius: 2,
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  ctaContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  ctaButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 12,
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  banner: {
    backgroundColor: "#007AFF",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  bannerSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  searchContainer: {
    backgroundColor: "#F2F2F7", // Mismo fondo para efecto 'sticky'
    paddingBottom: 10,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginHorizontal: 20,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#111",
  },
  planListContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  planListTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  planCardContainer: {
    paddingHorizontal: 20,
  },
});
