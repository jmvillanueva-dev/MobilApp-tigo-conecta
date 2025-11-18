import { PlanMovil } from "./Plan";

export type EstadoContratacion = "pendiente" | "aprobado" | "rechazado";

export interface Contratacion {
  id: string;
  user_id: string;
  plan_id: string;
  estado: EstadoContratacion;
  fecha_solicitud: string;
  fecha_aprobacion?: string | null;

  // Incluimos los datos del plan para mostrarlos en la lista
  plan?: PlanMovil;
}
