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
}
