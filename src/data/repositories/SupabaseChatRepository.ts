import { supabase } from "../services/supabaseClient";
import { Message } from "../../domain/entities/Message";

export class SupabaseChatRepository {
  /**
   * Obtiene los mensajes de una contratación específica (Sala de chat)
   */
  async getMessages(
    contratacionId: string
  ): Promise<{ data: Message[] | null; error: any }> {
    const { data, error } = await supabase
      .from("mensajes_chat")
      .select("*")
      .eq("contratacion_id", contratacionId)
      .order("created_at", { ascending: false }); // Orden inverso para la UI de chat

    return { data: data as Message[], error };
  }

  /**
   * Envía un mensaje
   */
  async sendMessage(
    contratacionId: string,
    senderId: string,
    content: string
  ): Promise<{ error: any }> {
    const { error } = await supabase.from("mensajes_chat").insert({
      contratacion_id: contratacionId,
      sender_id: senderId,
      contenido: content,
    });

    return { error };
  }

  /**
   * (Para el Asesor) Obtiene la lista de conversaciones activas.
   * Agrupa por contratación y trae el último mensaje.
   */
  async getConversations(): Promise<{ data: any[] | null; error: any }> {
    // Obtenemos las contrataciones que tienen mensajes o están activas
    const { data, error } = await supabase
      .from("contrataciones")
      .select(
        `
        id,
        plan:planes_moviles(nombre),
        user:profiles(full_name),
        mensajes:mensajes_chat(created_at, contenido)
      `
      )
      .order("created_at", { ascending: false });

    // NOTA: En un entorno real de producción, haríamos un filtrado más eficiente en SQL.
    // Aquí procesaremos en cliente para simplificar el MVP.

    return { data, error };
  }
}
