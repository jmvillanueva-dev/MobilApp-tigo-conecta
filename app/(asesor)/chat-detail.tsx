import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SupabaseChatRepository } from "../../src/data/repositories/SupabaseChatRepository";
import { supabase } from "../../src/data/services/supabaseClient";
import { Message } from "../../src/domain/entities/Message";
import { useAuth } from "../../src/presentation/contexts/AuthContext";

export default function AdvisorChatScreen() {
  const router = useRouter();
  // Obtenemos los parámetros que vienen de la lista de chats
  const { contratacionId, clientName } = useLocalSearchParams<{
    contratacionId: string;
    clientName: string;
  }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const repo = new SupabaseChatRepository();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!contratacionId) return;

    const fetchMessages = async () => {
      const { data } = await repo.getMessages(contratacionId);
      if (data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    // --- REALTIME SUBSCRIPTION ---
    // Escuchamos nuevos mensajes en esta contratación específica
    const channel = supabase
      .channel(`advisor-chat-${contratacionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_chat",
          filter: `contratacion_id=eq.${contratacionId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Agregamos el mensaje al inicio de la lista (porque está invertida)
          setMessages((prev) => [newMessage, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contratacionId]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    const content = inputText.trim();
    setInputText(""); // UX: Limpiar input inmediatamente
    setSending(true);

    const { error } = await repo.sendMessage(contratacionId, user.id, content);

    setSending(false);
    if (error) {
      console.error("Error enviando mensaje:", error);
      alert("No se pudo enviar el mensaje.");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Para el asesor, "mi mensaje" es el que él envió
    const isMyMessage = item.sender_id === user?.id;
    const time = new Date(item.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isMyMessage ? styles.myText : styles.theirText,
          ]}
        >
          {item.contenido}
        </Text>
        <Text
          style={[
            styles.timeText,
            isMyMessage ? styles.myTime : styles.theirTime,
          ]}
        >
          {time}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(asesor)/chat")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{clientName || "Cliente"}</Text>
          <Text style={styles.headerSubtitle}>Chat con Cliente</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted // Importante: La lista crece hacia arriba
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Inicia la conversación con el cliente.
            </Text>
          }
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe un mensaje..."
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.disabledSend,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F2F2F7" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  headerSubtitle: { fontSize: 14, color: "#666" },

  listContent: { padding: 16 },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    transform: [{ scaleY: -1 }],
  },

  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  // Estilos de burbujas invertidos para el asesor (su mensaje a la derecha)
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#34C759", // Verde para asesor (diferente al azul del usuario para distinguir roles si pruebas en mismo dispositivo)
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA", // Gris para el cliente
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 16 },
  myText: { color: "#FFF" },
  theirText: { color: "#000" },

  timeText: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  myTime: { color: "rgba(255,255,255,0.7)" },
  theirTime: { color: "#888" },

  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFF",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#34C759", // Verde a juego
    justifyContent: "center",
    alignItems: "center",
  },
  disabledSend: { backgroundColor: "#B0B0B0" },
});
