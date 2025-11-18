import { PlanMovil } from "../../domain/entities/Plan";
import { PlanRepository } from "../../domain/repositories/PlanRepository";
import { supabase } from "../services/supabaseClient";

/**
 * Implementación concreta del PlanRepository usando Supabase.
 */
export class SupabasePlanRepository implements PlanRepository {
  async getActivePlans(): Promise<{ plans: PlanMovil[] | null; error: any }> {
    const { data, error } = await supabase
      .from("planes_moviles")
      .select("*")
      .eq("activo", true)
      .order("precio", { ascending: true }); // Ordenamos por precio

    return { plans: data as PlanMovil[] | null, error };
  }

  async getAllPlans(): Promise<{ plans: PlanMovil[] | null; error: any }> {
    const { data, error } = await supabase
      .from("planes_moviles")
      .select("*")
      .order("created_at", { ascending: false }); // Los más recientes primero

    return { plans: data as PlanMovil[] | null, error };
  }

  async getPlanById(
    id: string
  ): Promise<{ plan: PlanMovil | null; error: any }> {
    const { data, error } = await supabase
      .from("planes_moviles")
      .select("*")
      .eq("id", id)
      .single();

    return { plan: data as PlanMovil | null, error };
  }

  async deletePlan(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("planes_moviles")
      .delete()
      .eq("id", id);

    return { error };
  }

  // Crear Plan
  async createPlan(plan: Omit<PlanMovil, "id" | "created_at">): Promise<{ plan: PlanMovil | null; error: any }> {
    const { data, error } = await supabase
      .from("planes_moviles")
      .insert(plan)
      .select()
      .single();
    return { plan: data as PlanMovil | null, error };
  }

  // Actualizar Plan
  async updatePlan(id: string, updates: Partial<PlanMovil>): Promise<{ plan: PlanMovil | null; error: any }> {
    const { data, error } = await supabase
      .from("planes_moviles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { plan: data as PlanMovil | null, error };
  }
}
