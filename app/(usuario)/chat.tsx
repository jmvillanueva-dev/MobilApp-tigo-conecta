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

import { RealtimeChannel } from "@supabase/supabase-js";
import { SupabaseChatRepository } from "../../src/data/repositories/SupabaseChatRepository";
import { supabase } from "../../src/data/services/supabaseClient";
import { Message } from "../../src/domain/entities/Message";
import { useAuth } from "../../src/presentation/contexts/AuthContext";

const repo = new SupabaseChatRepository();

export default function ChatScreen() {
  const router = useRouter();
  // Puede venir undefined si el usuario entra directo al tab "Chat" sin pasar por "Mis Planes"
  const { contratacionId, planName } = useLocalSearchParams<{
    contratacionId?: string;
    planName?: string;
  }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentAt = useRef<number>(0);

  useEffect(() => {
    // 1. Validación: Si no hay ID, terminamos la carga inmediatamente
    // para que se muestre la vista de "Seleccionar Chat"
    if (!contratacionId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await repo.getMessages(contratacionId);
      if (data) setMessages(data);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${contratacionId}`)
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
          setMessages((prev) => [newMessage, ...prev]);
        }
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        // Solo mostrar "escribiendo" si viene de otro usuario
        if (payload.payload.userId !== user?.id) {
          setIsTyping(true);
          // Auto-ocultar después de 3 segundos
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [contratacionId, user?.id]);

  const handleInputChange = (text: string) => {
    setInputText(text);

    // Enviar evento de "typing" solo si hay texto y ha pasado más de 2 segundos desde el último envío
    if (text.trim() && channelRef.current && user) {
      const now = Date.now();
      if (now - lastTypingSentAt.current > 2000) {
        channelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: user.id },
        });
        lastTypingSentAt.current = now;
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user || !contratacionId) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    const { error } = await repo.sendMessage(contratacionId, user.id, content);

    setSending(false);
    if (error) {
      console.error("Error enviando mensaje:", error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
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

  // --- VISTA DE ESTADO VACÍO (Sin chat seleccionado) ---
  if (!loading && !contratacionId) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#007AFF" />
          </View>
          <Text style={styles.emptyTitle}>No has seleccionado un chat</Text>
          <Text style={styles.emptySubtitle}>
            Para hablar con un asesor, primero debes seleccionar una de tus
            contrataciones activas.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.replace("/(usuario)/mis-planes")}
          >
            <Text style={styles.actionButtonText}>Ir a Mis Planes</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(usuario)/mis-planes")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Soporte Tigo</Text>
          <Text style={styles.headerSubtitle}>{planName || "Consulta"}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isTyping ? (
              <View style={styles.typingContainer}>
                <Text style={styles.typingText}>
                  El asesor está escribiendo...
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                marginTop: 20,
                transform: [{ scaleY: -1 }],
              }}
            >
              <Text style={{ color: "#999" }}>
                Inicia la conversación con un asesor.
              </Text>
            </View>
          }
        />
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
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

  // Estilos para estado vacío y carga
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  iconContainer: {
    backgroundColor: "#E6F2FF",
    padding: 30,
    borderRadius: 100,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Estilos del Chat
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    zIndex: 1,
  },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111" },
  headerSubtitle: { fontSize: 14, color: "#666" },

  listContent: { padding: 16 },

  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
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
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledSend: { backgroundColor: "#B0B0B0" },

  // Estilos para el indicador de typing
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  typingText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});
