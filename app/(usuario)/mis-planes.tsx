import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SupabaseContratacionRepository } from "../../src/data/repositories/SupabaseContratacionRepository";
import { supabase } from "../../src/data/services/supabaseClient";
import { Contratacion } from "../../src/domain/entities/Contratacion";
import { useAuth } from "../../src/presentation/contexts/AuthContext";

export default function MisPlanesScreen() {
  const { session, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [contrataciones, setContrataciones] = useState<Contratacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Validación de sesión
  useEffect(() => {
    if (!isAuthLoading && !session) {
      router.replace("/(auth)/login");
    }
  }, [session, isAuthLoading, router]);

  const fetchContrataciones = async () => {
    if (!user) return;
    const repo = new SupabaseContratacionRepository();
    const { data, error } = await repo.getMyContrataciones(user.id);
    if (!error && data) {
      setContrataciones(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Carga inicial y Realtime
  useEffect(() => {
    if (!user) return;

    fetchContrataciones();

    // Escuchar cambios en mis contrataciones (INSERT, UPDATE, DELETE)
    const subscription = supabase
      .channel("mis-contrataciones")
      .on(
        "postgres_changes",
        {
          event: "*", // <--- CAMBIO CLAVE: Escuchar TODO (INSERT para nuevos contratos, UPDATE para cambios de estado)
          schema: "public",
          table: "contrataciones",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Cambio detectado en mis contrataciones:", payload);
          fetchContrataciones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContrataciones();
  };

  // Función para renderizar el estado con colores
  const renderBadge = (estado: string) => {
    let bg = "#FF9500"; // Pendiente (Naranja)
    let text = "PENDIENTE";

    if (estado === "aprobado") {
      bg = "#34C759"; // Verde
      text = "APROBADO";
    } else if (estado === "rechazado") {
      bg = "#FF3B30"; // Rojo
      text = "RECHAZADO";
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg + "20" }]}>
        {/* El + "20" añade transparencia hex */}
        <Text style={[styles.badgeText, { color: bg }]}>{text}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Contratacion }) => {
    const fecha = new Date(item.fecha_solicitud).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.planName}>
            {item.plan?.nombre || "Plan desconocido"}
          </Text>
          {renderBadge(item.estado)}
        </View>

        <Text style={styles.dateText}>Solicitado el: {fecha}</Text>

        {item.plan && (
          <Text style={styles.priceText}>
            ${item.plan.precio}/mes • {item.plan.gigas_num} GB
          </Text>
        )}

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            // Navegar al chat pasando el ID de la contratación
            router.push({
              pathname: "/(usuario)/chat",
              params: { contratacionId: item.id, planName: item.plan?.nombre },
            });
          }}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.chatButtonText}>Chat con Asesor</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isAuthLoading || !session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={contrataciones}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#CCC" />
              <Text style={styles.emptyText}>
                No tienes planes contratados aún.
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.navigate("/(usuario)")}
              >
                <Text style={styles.exploreButtonText}>Explorar Planes</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2F2F7" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 20 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planName: { fontSize: 18, fontWeight: "bold", color: "#111", flex: 1 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, fontWeight: "bold" },

  dateText: { fontSize: 14, color: "#666", marginBottom: 4 },
  priceText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    marginBottom: 16,
  },

  chatButton: {
    backgroundColor: "#007AFF", // Azul Tigo
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  chatButtonText: { color: "#FFF", fontWeight: "600", fontSize: 15 },

  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { fontSize: 16, color: "#888", marginTop: 16, marginBottom: 20 },
  exploreButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  exploreButtonText: { color: "#007AFF", fontWeight: "600" },
});
