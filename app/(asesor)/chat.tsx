import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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

import { SupabaseChatRepository } from "../../src/data/repositories/SupabaseChatRepository";

export default function ChatListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const repo = new SupabaseChatRepository();

  const fetchConversations = async () => {
    const { data } = await repo.getConversations();
    if (data) {
      // Filtramos solo las contrataciones que tienen mensajes o son relevantes
      // (En este MVP mostramos todas las contrataciones como posibles chats)
      setConversations(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Recargar cada vez que entra a la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const renderItem = ({ item }: { item: any }) => {
    // Lógica simple para mostrar último mensaje (si existe)
    const lastMsg =
      item.mensajes && item.mensajes.length > 0
        ? item.mensajes[0].contenido
        : "Sin mensajes aún";

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          // IMPORTANTE: Necesitamos crear una ruta específica o usar un parámetro 'role'
          // para diferenciar si queremos ajustar la UI, pero la lógica es la misma.
          // Por ahora usaremos una ruta dedicada para evitar conflictos de navegación.
          router.push({
            pathname: "/(asesor)/chat-detail",
            params: {
              contratacionId: item.id,
              clientName: item.user?.full_name,
            },
          });
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.user?.full_name?.charAt(0).toUpperCase() || "C"}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.clientName}>{item.user?.full_name}</Text>
            <Text style={styles.planLabel}>{item.plan?.nombre}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMsg}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                No hay conversaciones activas.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },

  header: {
    backgroundColor: "#0D47A1",
    padding: 15,
    alignItems: "center",
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

  chatItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E6F2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: "bold", color: "#007AFF" },
  chatInfo: { flex: 1, marginRight: 10 },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  clientName: { fontSize: 14, fontWeight: "bold", color: "#333" },
  planLabel: {
    fontSize: 10,
    color: "#007AFF",
    backgroundColor: "#E6F2FF",
    padding: 6,
    borderRadius: 4,
    overflow: "hidden",
  },
  lastMessage: { fontSize: 14, color: "#888" },
  emptyText: { color: "#999", fontSize: 16 },
});
