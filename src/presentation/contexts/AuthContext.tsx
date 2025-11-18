import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../data/services/supabaseClient";
import { AppUser, Profile, UserRole } from "../../domain/entities/User";
import { SupabaseAuthRepository } from "../../data/repositories/SupabaseAuthRepository";
import {
  AuthCredentials,
  AuthRepository,
  SignUpData,
} from "../../domain/repositories/AuthRepository";

// 1. Definimos la forma del estado de autenticación
export interface AuthState {
  session: Session | null;
  user: AppUser | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (credentials: AuthCredentials) => Promise<{ error: any }>;
  signUp: (data: SignUpData) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfileData: (
    updates: Partial<Omit<Profile, "id" | "rol" | "created_at">>
  ) => Promise<{ profile: Profile | null; error: any }>;
  updateAuthEmail: (
    email: string
  ) => Promise<{ user: User | null; error: any }>;
}

// 2. Creamos el contexto con un valor por defecto
const AuthContext = createContext<AuthState | undefined>(undefined);

// 3. Creamos el Proveedor (Provider)
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Instanciamos nuestro repositorio
  const authRepository: AuthRepository = new SupabaseAuthRepository();

  useEffect(() => {
    setIsLoading(true);

    // 1. Intentar obtener la sesión activa al cargar la app
    authRepository.getSession().then(async ({ session, error }) => {
      if (session) {
        // Si hay sesión, cargar el perfil
        const { profile, error: profileError } =
          await authRepository.getProfile(session.user.id);

        if (profile) {
          setSession(session);
          setUser({ ...session.user, profile } as AppUser);
          setProfile(profile);
          setRole(profile.rol);
        } else {
          // Caso raro: sesión existe pero perfil no. Forzar cierre.
          console.error(
            "Error: Perfil no encontrado, cerrando sesión.",
            profileError
          );
          await authRepository.signOut();
        }
      }
      setIsLoading(false);
    });

    // 2. Escuchar cambios de autenticación (Login, Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        // --- INICIO: LÓGICA DE ACTUALIZACIÓN DE ESTADO ---
        const updateState = async (session: Session | null) => {
          if (session) {
            const { profile, error } = await authRepository.getProfile(
              session.user.id
            );

            if (profile) {
              setSession(session);
              // Actualiza el email en el objeto 'user' si cambió
              const authUser = session.user;
              setUser({ ...authUser, profile } as AppUser);
              setProfile(profile);
              setRole(profile.rol);
            } else {
              console.error(
                "Error post-login: No se pudo cargar el perfil.",
                error
              );
            }
          } else {
            // Usuario ha cerrado sesión (SIGNED_OUT)
            setSession(null);
            setUser(null);
            setProfile(null);
            setRole(null);
          }
        };
        // --- FIN: LÓGICA DE ACTUALIZACIÓN DE ESTADO ---

        // Manejamos eventos específicos
        if (_event === "SIGNED_IN" || _event === "INITIAL_SESSION") {
          await updateState(newSession);
        } else if (_event === "SIGNED_OUT") {
          await updateState(null);
        } else if (_event === "USER_UPDATED") {
          // Esto se dispara cuando se actualiza el email/pass
          // o cuando el trigger de registro termina.
          await updateState(newSession);
        }

        // La carga inicial solo termina después del primer chequeo
        setIsLoading(false);
      }
    );

    // Limpiar el listener al desmontar
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 3. Funciones de autenticación expuestas
  const signIn = async (credentials: AuthCredentials) => {
    const { error } = await authRepository.signInWithEmail(credentials);
    return { error };
  };

  const signUp = async (data: SignUpData) => {
    const { error } = await authRepository.signUpWithEmail(data);
    return { error };
  };

  const signOut = async () => {
    await authRepository.signOut();
    // El listener onAuthStateChanged se encargará de limpiar el estado.
  };

  const resetPassword = async (email: string) => {
    const { error } = await authRepository.resetPasswordForEmail(email);
    return { error };
  };

  /**
   * Actualiza los datos del perfil (nombre, teléfono)
   */
  const updateProfileData = async (
    updates: Partial<Omit<Profile, "id" | "rol" | "created_at">>
  ) => {
    if (!user) {
      return { profile: null, error: { message: "No hay usuario" } };
    }

    const { profile: updatedProfile, error } =
      await authRepository.updateProfile(user.id, updates);

    if (updatedProfile) {
      // Actualizamos el estado local inmediatamente
      setProfile(updatedProfile);
      setUser((prevUser) =>
        prevUser ? ({ ...prevUser, profile: updatedProfile } as AppUser) : null
      );
    }

    return { profile: updatedProfile, error };
  };

  /**
   * Actualiza el email de autenticación
   */
  const updateAuthEmail = async (email: string) => {
    const { user: updatedUser, error } = await authRepository.updateUserEmail(
      email
    );
    // Nota: El listener 'onAuthStateChange' con evento 'USER_UPDATED'
    // se disparará si el email necesita confirmación,
    // o actualizará la sesión si el cambio es inmediato.
    return { user: updatedUser, error };
  };

  // 4. Valor que proveeremos al resto de la app
  const value = {
    session,
    user,
    profile,
    role,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfileData, 
    updateAuthEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 5. Hook personalizado para consumir el contexto
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
