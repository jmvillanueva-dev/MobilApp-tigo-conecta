import {
  AuthRepository,
  AuthCredentials,
  SignUpData,
} from "../../domain/repositories/AuthRepository";
import { Profile } from "../../domain/entities/User";
import { supabase } from "../services/supabaseClient"; // Importamos el cliente
import { Session, User } from "@supabase/supabase-js";

/**
 * Implementación concreta del AuthRepository usando Supabase.
 */
export class SupabaseAuthRepository implements AuthRepository {
  async signInWithEmail({
    email,
    password,
  }: AuthCredentials): Promise<{
    user: User | null;
    session: Session | null;
    error: any;
  }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, session: data.session, error };
  }

  async signUpWithEmail({
    email,
    password,
    full_name,
    phone,
  }: SignUpData): Promise<{
    user: User | null;
    session: Session | null;
    error: any;
  }> {
    /**
     * ¡Clave! Pasamos full_name y phone en 'options.data'.
     * Nuestro Trigger SQL 'handle_new_user' (02-create-new-user-trigger.sql)
     * leerá esto desde 'NEW.raw_user_meta_data' y poblará la tabla 'profiles'.
     */
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
        },
      },
    });
    return { user: data.user, session: data.session, error };
  }

  async signOut(): Promise<{ error: any }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getSession(): Promise<{ session: Session | null; error: any }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }

  async getProfile(
    userId: string
  ): Promise<{ profile: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single(); // Esperamos un solo resultado

    return { profile: data as Profile | null, error };
  }

  async resetPasswordForEmail(email: string): Promise<{ error: any }> {
    // Supabase enviará un enlace de reseteo.
    // Usará la URL (SITE_URL) y la plantilla de email
    // configuradas en el panel de Supabase Auth (que ya sabemos que funciona por el registro).
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }
}
