import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// Definimos una interfaz extendida para la UI del asesor que incluye los datos del JOIN
interface SolicitudExtendida {
  id: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  fecha_solicitud: string;
  plan: {
    nombre: string;
    precio: number;
  };
  user: {
    full_name: string;
    phone: string;
  };
}

export default function SolicitudesScreen() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<SolicitudExtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtro local para tabs: 'pendientes' | 'historial'
  const [filter, setFilter] = useState<"pendientes" | "historial">(
    "pendientes"
  );

  const repo = new SupabaseContratacionRepository();

  const fetchSolicitudes = async () => {
    // No activamos loading general si es refresh
    if (!refreshing) setLoading(true);

    const { data, error } = await repo.getAllContrataciones();

    if (error) {
      console.error(error);
      Alert.alert("Error", "No se pudieron cargar las solicitudes.");
    } else {
      setSolicitudes(data as SolicitudExtendida[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchSolicitudes();

    // --- REALTIME ---
    // Escuchar nuevas solicitudes o cambios de estado
    const subscription = supabase
      .channel("admin-solicitudes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contrataciones" },
        () => {
          // Recargar lista silenciosamente
          const reload = async () => {
            const { data } = await repo.getAllContrataciones();
            if (data) setSolicitudes(data as SolicitudExtendida[]);
          };
          reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleUpdateEstado = (
    id: string,
    nuevoEstado: "aprobado" | "rechazado",
    nombreCliente: string
  ) => {
    Alert.alert(
      nuevoEstado === "aprobado" ? "Aprobar Solicitud" : "Rechazar Solicitud",
      `¿Confirmas ${
        nuevoEstado === "aprobado" ? "aprobar" : "rechazar"
      } la solicitud de ${nombreCliente}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: nuevoEstado === "rechazado" ? "destructive" : "default",
          onPress: async () => {
            // Actualización optimista en UI
            setSolicitudes((prev) =>
              prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
            );

            // Llamada a DB
            const { error } = await repo.updateEstado(id, nuevoEstado);
            if (error) {
              Alert.alert("Error", "No se pudo actualizar la solicitud.");
              fetchSolicitudes(); // Revertir cambios si falla
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSolicitudes();
  };

  // Filtrar los datos según el tab seleccionado
  const dataToShow = solicitudes.filter((s) => {
    if (filter === "pendientes") return s.estado === "pendiente";
    return s.estado !== "pendiente"; // Historial
  });

  const renderItem = ({ item }: { item: SolicitudExtendida }) => {
    const fecha = new Date(item.fecha_solicitud).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.clientName}>
            {item.user?.full_name || "Usuario Desconocido"}
          </Text>
          <View
            style={[
              styles.badge,
              item.estado === "pendiente"
                ? styles.badgeWarning
                : item.estado === "aprobado"
                ? styles.badgeSuccess
                : styles.badgeError,
            ]}
          >
            <Text style={styles.badgeText}>{item.estado.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.planText}>
          Solicita:{" "}
          <Text style={{ fontWeight: "bold" }}>{item.plan?.nombre}</Text>
        </Text>
        <Text style={styles.dateText}>{fecha}</Text>
        <Text style={styles.contactText}>
          📞 {item.user?.phone || "Sin teléfono"}
        </Text>

        {/* Botones de Acción (Solo si está pendiente) */}
        {item.estado === "pendiente" && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() =>
                handleUpdateEstado(item.id, "rechazado", item.user?.full_name)
              }
            >
              <Ionicons name="close-circle-outline" size={20} color="#FFF" />
              <Text style={styles.actionText}>Rechazar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() =>
                handleUpdateEstado(item.id, "aprobado", item.user?.full_name)
              }
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFF"
              />
              <Text style={styles.actionText}>Aprobar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón de Chat (Siempre visible) */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            // Navegar al chat con este cliente
            // NOTA: Asegúrate de tener implementada la ruta dinámica en app/(asesor)/chat/[id].tsx
            // o pasar parametros al chat general
            router.push({
              pathname: "/(asesor)/chat",
              params: {
                clienteId: item.id,
                nombreCliente: item.user?.full_name,
              },
            });
          }}
        >
          <Ionicons name="chatbubbles-outline" size={18} color="#007AFF" />
          <Text style={styles.chatButtonText}>Contactar Cliente</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Solicitudes de Contratación</Text>
      </View>

      {/* Tabs Superiores */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, filter === "pendientes" && styles.activeTab]}
          onPress={() => setFilter("pendientes")}
        >
          <Text
            style={[
              styles.tabText,
              filter === "pendientes" && styles.activeTabText,
            ]}
          >
            Pendientes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === "historial" && styles.activeTab]}
          onPress={() => setFilter("historial")}
        >
          <Text
            style={[
              styles.tabText,
              filter === "historial" && styles.activeTabText,
            ]}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {loading && solicitudes.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={dataToShow}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={50} color="#CCC" />
              <Text style={styles.emptyText}>
                No hay solicitudes{" "}
                {filter === "pendientes" ? "pendientes" : "en el historial"}.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2F2F7" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: "#0D47A1",
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 4,
    margin: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 6 },
  activeTab: { backgroundColor: "#E6F2FF" },
  tabText: { fontWeight: "600", color: "#666" },
  activeTabText: { color: "#007AFF" },

  listContent: { paddingHorizontal: 16, paddingBottom: 20 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clientName: { fontSize: 18, fontWeight: "bold", color: "#111" },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeWarning: { backgroundColor: "#FFF3CD" }, // Amarillo claro
  badgeSuccess: { backgroundColor: "#D1E7DD" }, // Verde claro
  badgeError: { backgroundColor: "#F8D7DA" }, // Rojo claro
  badgeText: { fontSize: 10, fontWeight: "bold", color: "#333" },

  planText: { fontSize: 16, color: "#333", marginBottom: 4 },
  dateText: { fontSize: 12, color: "#888", marginBottom: 4 },
  contactText: { fontSize: 14, color: "#555", marginBottom: 12 },

  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: { backgroundColor: "#34C759" },
  rejectButton: { backgroundColor: "#FF3B30" },
  actionText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },

  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    gap: 6,
  },
  chatButtonText: { color: "#007AFF", fontWeight: "600" },

  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#888", marginTop: 10 },
});
