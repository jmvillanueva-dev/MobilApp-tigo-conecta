import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { SupabasePlanRepository } from "../../src/data/repositories/SupabasePlanRepository";
import { supabase } from "../../src/data/services/supabaseClient";
import { PlanMovil } from "../../src/domain/entities/Plan";
import { PlanCard } from "../../src/presentation/components/PlanCard";

export default function PlanesManagementScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanMovil[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const planRepository = new SupabasePlanRepository();

  // Cargar planes
  const fetchPlans = async () => {
    // No ponemos setLoading(true) aquí para evitar parpadeo en pull-to-refresh
    // Solo al inicio
    const { plans, error } = await planRepository.getAllPlans();
    if (error) {
      Alert.alert("Error", "No se pudieron cargar los planes.");
      console.error(error);
    } else {
      setPlans(plans || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // --- IMPLEMENTACIÓN REALTIME ---
  useEffect(() => {
    // 1. Carga inicial
    fetchPlans();

    // 2. Suscripción a cambios en la tabla 'planes_moviles'
    const plansSubscription = supabase
      .channel("planes-updates-asesor") // Nombre arbitrario del canal
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "planes_moviles" },
        (payload) => {
          console.log("Cambio detectado en planes:", payload);
          // Simplemente recargamos todo para mantener consistencia
          // (Podríamos optimizar manipulando el array 'plans' manualmente)
          fetchPlans();
        }
      )
      .subscribe();

    // 3. Limpieza
    return () => {
      supabase.removeChannel(plansSubscription);
    };
  }, []);

  // Usamos useFocusEffect para recargar la lista cuando volvemos de Crear/Editar
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPlans();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const handleDelete = (id: string, nombre: string) => {
    Alert.alert(
      "Eliminar Plan",
      `¿Estás seguro de que deseas eliminar el plan "${nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            // 1. Eliminar optimísticamente (UI primero)
            const previousPlans = [...plans];
            setPlans(plans.filter((p) => p.id !== id));

            // 2. Llamada a DB
            const { error } = await planRepository.deletePlan(id);
            if (error) {
              // Revertir si falla
              setPlans(previousPlans);
              Alert.alert("Error", "No se pudo eliminar el plan.");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (id: string) => {
    router.push({ pathname: "/(asesor)/plan-form", params: { id } });
  };

  const handleCreate = () => {
    router.push("/(asesor)/plan-form");
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={styles.headerTitle}>Gestión de Planes</Text>
        <Text style={styles.headerSubtitle}>Administra el catálogo de planes de Tigo</Text>
      </View>
      <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
        <Ionicons name="add" size={24} color="#FFF" />
        <Text style={styles.createButtonText}>Nuevo Plan</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && plans.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <PlanCard
              plan={item}
              isAdmin={true} // Activamos el modo admin
              onPress={() => handleEdit(item.id)} // Al tocar la tarjeta también edita
              onEdit={() => handleEdit(item.id)}
              onDelete={() => handleDelete(item.id, item.nombre)}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay planes registrados.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  createButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});
