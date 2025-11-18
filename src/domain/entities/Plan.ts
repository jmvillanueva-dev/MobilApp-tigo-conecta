/**
 * Define las características técnicas almacenadas en la columna JSONB
 */
export interface PlanDetallesTecnicos {
  datos_moviles: string;
  minutos_voz: string;
  sms: string;
  velocidad_4g: string;
  velocidad_5g?: string; // Opcional, no todos los planes lo tienen
  redes_sociales: string;
  whatsapp: string;
  llamadas_internacionales: string;
  roaming: string;
  [key: string]: any; // Permite otras propiedades
}

/**
 * Define la entidad PlanMovil, que coincide con nuestra tabla SQL 
 */
export interface PlanMovil {
  id: string; // uuid
  nombre: string;
  precio: number;
  descripcion_corta: string | null;
  promocion: string | null;

  // Columnas de primer nivel para filtros y UI
  gigas_num: number | null;
  minutos_num: number | null;
  segmento: string | null;
  publico_objetivo: string | null;

  imagen_url: string | null;
  activo: boolean;
  detalles_tecnicos: PlanDetallesTecnicos | null;
  created_at: string;
}
