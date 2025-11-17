import { User as SupabaseUser } from "@supabase/supabase-js";

// 1. Definimos el tipo para nuestro rol, basado en el ENUM de SQL
export type UserRole = "asesor_comercial" | "usuario_registrado";

// 2. Definimos la entidad Profile, que coincide con nuestra tabla 'profiles'
export interface Profile {
  id: string; // uuid
  rol: UserRole;
  full_name: string | null;
  phone: string | null;
  updated_at: string;
  created_at: string;
}

// 3. Definimos la entidad 'User' de nuestra aplicación.
// Es una combinación del usuario de Supabase Auth y nuestro perfil de la DB.
export interface AppUser extends SupabaseUser {
  profile: Profile | null;
}
