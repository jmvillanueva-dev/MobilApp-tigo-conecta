import { Session, User } from "@supabase/supabase-js";
import { Profile } from "../entities/User";

// 1. Datos necesarios para el inicio de sesión
export interface AuthCredentials {
  email: string;
  password: string;
}

// 2. Datos necesarios para el registro
export interface SignUpData extends AuthCredentials {
  full_name: string;
  phone: string;
}

// 3. Definimos la interfaz (el contrato)
// Estas son las acciones que nuestra UI necesitará hacer,
// sin saber CÓMO se implementan.
export interface AuthRepository {
  /**
   * Inicia sesión con email y contraseña
   */
  signInWithEmail(
    credentials: AuthCredentials
  ): Promise<{ user: User | null; session: Session | null; error: any }>;

  /**
   * Registra un nuevo usuario
   */
  signUpWithEmail(
    data: SignUpData
  ): Promise<{ user: User | null; session: Session | null; error: any }>;

  /**
   * Cierra la sesión actual
   */
  signOut(): Promise<{ error: any }>;

  /**
   * Obtiene la sesión actual (si existe)
   */
  getSession(): Promise<{ session: Session | null; error: any }>;

  /**
   * Obtiene el perfil de un usuario desde la tabla 'profiles'
   */
  getProfile(userId: string): Promise<{ profile: Profile | null; error: any }>;

  /**
   * Envía un email para resetear la contraseña
   */
  resetPasswordForEmail(email: string): Promise<{ error: any }>;

  /**
   * Actualiza los datos mutables del usuario en la tabla 'profiles'.
   * Usamos Partial<Profile> para permitir actualizaciones parciales (ej: solo nombre).
   */
  updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, "id" | "rol" | "created_at">>
  ): Promise<{ profile: Profile | null; error: any }>;

  /**
   * Actualiza el email de autenticación del usuario (en auth.users).
   * Supabase enviará un email de confirmación para este cambio.
   */
  updateUserEmail(email: string): Promise<{ user: User | null; error: any }>;
}
