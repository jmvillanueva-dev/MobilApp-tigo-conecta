import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SupabasePlanRepository } from "../../src/data/repositories/SupabasePlanRepository";
import { supabase } from "../../src/data/services/supabaseClient";
import { PlanMovil } from "../../src/domain/entities/Plan";
import { PlanRepository } from "../../src/domain/repositories/PlanRepository";
import { PlanCard } from "../../src/presentation/components/PlanCard";
import { SearchBar } from "../../src/presentation/components/SearchBar";
import { useAuth } from "../../src/presentation/contexts/AuthContext";

export default function UserHomeScreen() {
  const router = useRouter();
  const { profile, user, session, isLoading: isAuthLoading } = useAuth();

  const [plans, setPlans] = useState<PlanMovil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. PROTECCIÓN DE RUTA (Mantenemos la lógica de seguridad) ---
  useEffect(() => {
    if (!isAuthLoading && !session) {
      // Si terminó de cargar y no hay sesión, sacar al usuario
      router.replace("/(auth)/login");
    }
  }, [session, isAuthLoading, router]);

  // Manejo de búsqueda
  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
  };

  // Obtener planes y configurar Realtime
  useEffect(() => {
    if (!session) return; // No cargar si no hay sesión

    const fetchPlans = async () => {
      setLoading(true);
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

    // Suscripción Realtime
    const subscription = supabase
      .channel("planes-updates-user")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "planes_moviles",
          filter: "activo=eq.true",
        },
        () => {
          console.log("Cambio detectado en catálogo, recargando...");
          fetchPlans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session]); // Dependencia de session

  // Filtrado local
  const filteredPlans = useMemo(() => {
    if (!searchTerm) return plans;
    const lowerTerm = searchTerm.toLowerCase();
    return plans.filter(
      (plan) =>
        plan.nombre.toLowerCase().includes(lowerTerm) ||
        (plan.descripcion_corta &&
          plan.descripcion_corta.toLowerCase().includes(lowerTerm))
    );
  }, [plans, searchTerm]);

  // Renderizado de estados vacíos
  const renderListEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 30 }}
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
    // --- 2. BOTÓN LIMPIAR BÚSQUEDA ---
    if (filteredPlans.length === 0 && searchTerm) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No se encontraron planes con &ldquo;{searchTerm}&rdquo;
          </Text>
          <TouchableOpacity
            onPress={() => setSearchTerm("")}
            style={styles.clearSearchButton}
          >
            <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  // Si no hay sesión o está cargando Auth, mostramos loader de pantalla completa
  if (isAuthLoading || !session) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header Fijo */}
      <View style={styles.headerContainer}>
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greetingText}>
              Hola, {profile?.full_name?.split(" ")[0] || "Usuario"}
            </Text>
            <Text style={styles.subGreetingText}>
              Explora los planes disponibles
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/(usuario)/perfil")}
          >
            <Ionicons name="person-circle-outline" size={36} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchTerm}
            onChangeText={handleSearchChange}
            placeholder="Buscar planes..."
          />
        </View>
      </View>

      {/* Lista de Planes */}
      <FlatList
        data={loading || error ? [] : filteredPlans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.planCardContainer}>
            <PlanCard
              plan={item}
              // Acción Ver Detalles
              onPress={() => {
                router.push({
                  pathname: "/(usuario)/plan-detail",
                  params: { id: item.id },
                });
              }}
              // --- 3. ACCIÓN CONTRATAR ---
              onContract={() => {
                router.push({
                  pathname: "/(usuario)/plan-detail",
                  params: { id: item.id },
                });
              }}
            />
          </View>
        )}
        ListHeaderComponent={<View style={{ height: 10 }} />}
        ListEmptyComponent={renderListEmptyState}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2F2F7" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },

  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
  },
  subGreetingText: {
    fontSize: 14,
    color: "#666",
  },
  profileButton: {
    padding: 4,
  },
  searchContainer: {
    paddingVertical: 0,
  },

  flatListContent: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  planCardContainer: {
    paddingHorizontal: 20,
  },

  // Estados vacíos
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 50,
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    fontSize: 16,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 50,
  },
  noResultsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  // Estilo botón limpiar
  clearSearchButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
