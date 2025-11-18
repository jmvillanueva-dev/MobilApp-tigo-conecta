import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  LayoutAnimation,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SupabasePlanRepository } from "../../src/data/repositories/SupabasePlanRepository";
import { PlanMovil } from "../../src/domain/entities/Plan";
import { PlanRepository } from "../../src/domain/repositories/PlanRepository";
import { PlanCard } from "../../src/presentation/components/PlanCard";
import { SearchBar } from "../../src/presentation/components/SearchBar";

export default function ExploreScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanMovil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Referencias y valores animados
  const flatListRef = useRef<FlatList>(null);
  const headerHeight = useRef(new Animated.Value(1)).current; // 1 = expandido, 0 = compacto

  // Función simple para manejar cambios de búsqueda
  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    setIsSearching(text.length > 0);
  };

  // Determinar si el header debe estar expandido
  const shouldExpandHeader = !isSearching && !isKeyboardVisible;

  // Animar header cuando cambien las condiciones
  useEffect(() => {
    if (Platform.OS === "ios") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    Animated.timing(headerHeight, {
      toValue: shouldExpandHeader ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [shouldExpandHeader, headerHeight]);

  // Listener para el teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
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
  }, []);

  // Lógica de filtrado (sin cambios)
  const filteredPlans = useMemo(() => {
    if (!searchTerm) {
      return plans;
    }
    return plans.filter(
      (plan) =>
        plan.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.descripcion_corta &&
          plan.descripcion_corta
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );
  }, [plans, searchTerm]);

  /**
   * Header simple de la lista
   */
  const renderListHeader = () => <View style={styles.listHeaderSpacer} />;

  /**
   * Renderiza el estado de la lista (Cargando, Error, o Sin Resultados)
   * Se usará para el 'ListEmptyComponent'
   */
  // 4. Envolvemos la función en useCallback
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
    // Si no está cargando, no hay error, Y la lista filtrada está vacía...
    if (filteredPlans.length === 0 && searchTerm) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No se encontraron planes con &quot;{searchTerm}&quot;
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchTerm("");
              setIsSearching(false);
            }}
            style={styles.clearSearchButton}
          >
            <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  /**
   * --- Estructura Principal Optimizada ---
   */
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header con altura fija para evitar saltos */}
      <View style={styles.headerContainer}>
        {/* Header superior fijo */}
        <View style={styles.topHeader}>
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
          <TouchableOpacity
            onPress={() => router.replace("/(auth)/login")}
            style={styles.loginButtonTop}
          >
            <Text style={styles.loginButtonTopText}>Iniciar Sesion</Text>
          </TouchableOpacity>
        </View>

        {/* Contenido expandible animado */}
        <Animated.View
          style={[
            styles.expandableContent,
            {
              height: headerHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 100], // Altura cuando está expandido
              }),
              opacity: headerHeight.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0, 1],
              }),
            },
          ]}
        >
          {/* Banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Nuevos Planes Tigo</Text>
            <Text style={styles.bannerSubtitle}>
              Los mejores planes del mercado
            </Text>
          </View>
        </Animated.View>

        {/* SearchBar siempre visible */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchTerm}
            onChangeText={handleSearchChange}
            placeholder="Buscar planes..."
          />
        </View>

        {/* Subtítulo contextual */}
        <View style={styles.subtitleContainer}>
          {isSearching ? (
            <Text style={styles.subtitleText}>
              Buscando: &quot;{searchTerm}&quot;
            </Text>
          ) : (
            <Text style={styles.subtitleText}>Planes Disponibles</Text>
          )}
        </View>
      </View>

      {/* Lista de planes */}
      <FlatList
        style={styles.container}
        data={loading || error ? [] : filteredPlans}
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
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmptyState}
        ref={flatListRef}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => {
          if (searchTerm === "") {
            Keyboard.dismiss();
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2F2F7" },
  container: { flex: 1 },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  expandableContent: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  loginButtonTop: {
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  loginButtonTopText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  subtitleContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  subtitleText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
    borderColor: "#EEE",
    borderWidth: 1,
  },
  logoContainer: {
    alignItems: "center",
    flex: 1,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0D47A1", // Color Tigo
    letterSpacing: -0.5,
  },
  logoAccent: {
    width: 30,
    height: 3,
    backgroundColor: "#007AFF", // Color Tigo
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
    marginHorizontal: 20,
    marginBottom: 15,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  banner: {
    backgroundColor: "#007AFF",
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
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
    backgroundColor: "#FFFFFF",
    paddingBottom: 10,
    paddingTop: 5,
    paddingHorizontal: 20,
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
  listHeaderSpacer: {
    height: 5,
  },
  planCardContainer: {
    paddingHorizontal: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },

  // Estilos para estados (Loading, Error, Empty)
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
