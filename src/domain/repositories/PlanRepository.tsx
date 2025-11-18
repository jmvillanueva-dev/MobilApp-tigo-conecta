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
   * Obtiene TODOS los planes (activos e inactivos) para gestión del asesor.
   */
  getAllPlans(): Promise<{ plans: PlanMovil[] | null; error: any }>;

  /**
   * Obtiene un plan específico por su ID.
   * La RLS ya asegura que solo podamos ver planes 'activos'.
   */
  getPlanById(id: string): Promise<{ plan: PlanMovil | null; error: any }>;

  /**
   * Elimina un plan por su ID.
   */
  deletePlan(id: string): Promise<{ error: any }>;

  /**
   * Crea un nuevo plan.
   */
  createPlan(
    plan: Omit<PlanMovil, "id" | "created_at">
  ): Promise<{ plan: PlanMovil | null; error: any }>;

  /**
   * Actualiza un plan existente.
   */
  updatePlan(
    id: string,
    updates: Partial<PlanMovil>
  ): Promise<{ plan: PlanMovil | null; error: any }>;
}
