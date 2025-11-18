import { PlanMovil } from "../entities/Plan";

/**
 * Contrato para el repositorio de Planes Móviles
 */
export interface PlanRepository {
  /**
   * Obtiene todos los planes que están marcados como 'activos'
   */
  getActivePlans(): Promise<{ plans: PlanMovil[] | null; error: any }>;

  /**
   * Obtiene un plan específico por su ID.
   * La RLS ya asegura que solo podamos ver planes 'activos'.
   */
  getPlanById(id: string): Promise<{ plan: PlanMovil | null; error: any }>;

  // Futuras funciones para Asesor:
  // createPlan(planData: Omit<PlanMovil, 'id' | 'created_at'>): Promise<{ plan: PlanMovil | null, error: any }>;
  // updatePlan(planId: string, planData: Partial<PlanMovil>): Promise<{ plan: PlanMovil | null, error: any }>;
  // deletePlan(planId: string): Promise<{ error: any }>;
}
