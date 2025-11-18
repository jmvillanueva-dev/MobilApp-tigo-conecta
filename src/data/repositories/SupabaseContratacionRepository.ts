import { supabase } from "../services/supabaseClient";
import {
  Contratacion,
  EstadoContratacion,
} from "../../domain/entities/Contratacion";

export class SupabaseContratacionRepository {
  /**
   * Crea una nueva solicitud de contratación
   */
  async createContratacion(
    userId: string,
    planId: string
  ): Promise<{ data: Contratacion | null; error: any }> {
    const { data, error } = await supabase
      .from("contrataciones")
      .insert({
        user_id: userId,
        plan_id: planId,
        estado: "pendiente",
      })
      .select()
      .single();

    return { data, error };
  }

  /**
   * Obtiene las contrataciones de un usuario específico.
   * Incluye los datos del Plan relacionado (JOIN).
   */
  async getMyContrataciones(
    userId: string
  ): Promise<{ data: Contratacion[] | null; error: any }> {
    const { data, error } = await supabase
      .from("contrataciones")
      .select(
        `
        *,
        plan:planes_moviles (
          nombre,
          precio,
          gigas_num,
          minutos_num
        )
      `
      )
      .eq("user_id", userId)
      .order("fecha_solicitud", { ascending: false });

    return { data: data as any, error };
  }

  /**
   * --- MÉTODOS PARA EL ASESOR ---
   */

  /**
   * Obtiene TODAS las contrataciones.
   * CORRECCIÓN: Se eliminó la referencia a 'email' que causaba el error.
   */
  async getAllContrataciones(): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from("contrataciones")
      .select(
        `
        *,
        plan:planes_moviles (
          nombre,
          precio
        ),
        user:profiles (
          full_name,
          phone
        )
      `
      )
      .order("fecha_solicitud", { ascending: false });

    return { data, error };
  }

  /**
   * Actualiza el estado de una contratación (Aprobar/Rechazar)
   */
  async updateEstado(
    id: string,
    nuevoEstado: EstadoContratacion
  ): Promise<{ error: any }> {
    const updates: any = { estado: nuevoEstado };

    // Si se aprueba, guardamos la fecha de aprobación
    if (nuevoEstado === "aprobado") {
      updates.fecha_aprobacion = new Date().toISOString();
    }

    const { error } = await supabase
      .from("contrataciones")
      .update(updates)
      .eq("id", id);

    return { error };
  }
}
