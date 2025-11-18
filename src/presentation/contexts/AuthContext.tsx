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

export interface AuthState {
  session: Session | null;
  user: AppUser | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isSigningOut: boolean;
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

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false); // <- NUEVO

  const authRepository: AuthRepository = new SupabaseAuthRepository();

  useEffect(() => {
    setIsLoading(true);

    authRepository.getSession().then(async ({ session, error }) => {
      if (session) {
        const { profile, error: profileError } =
          await authRepository.getProfile(session.user.id);

        if (profile) {
          setSession(session);
          setUser({ ...session.user, profile } as AppUser);
          setProfile(profile);
          setRole(profile.rol);
        } else {
          console.error(
            "Error: Perfil no encontrado, cerrando sesión.",
            profileError
          );
          await authRepository.signOut();
        }
      }
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const updateState = async (session: Session | null) => {
          if (session) {
            const { profile, error } = await authRepository.getProfile(
              session.user.id
            );

            if (profile) {
              setSession(session);
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

        if (_event === "SIGNED_IN" || _event === "INITIAL_SESSION") {
          await updateState(newSession);
        } else if (_event === "SIGNED_OUT") {
          await updateState(null);
        } else if (_event === "USER_UPDATED") {
          await updateState(newSession);
        }

        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: AuthCredentials) => {
    const { error } = await authRepository.signInWithEmail(credentials);
    return { error };
  };

  const signUp = async (data: SignUpData) => {
    const { error } = await authRepository.signUpWithEmail(data);
    return { error };
  };

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole(null);
      await authRepository.signOut()
    } catch (error) {
      console.error("Error durante signOut:", error);
    } finally {
      setIsSigningOut(false); // <- NUEVO: Limpiar el estado
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await authRepository.resetPasswordForEmail(email);
    return { error };
  };

  const updateProfileData = async (
    updates: Partial<Omit<Profile, "id" | "rol" | "created_at">>
  ) => {
    if (!user) {
      return { profile: null, error: { message: "No hay usuario" } };
    }

    const { profile: updatedProfile, error } =
      await authRepository.updateProfile(user.id, updates);

    if (updatedProfile) {
      setProfile(updatedProfile);
      setUser((prevUser) =>
        prevUser ? ({ ...prevUser, profile: updatedProfile } as AppUser) : null
      );
    }

    return { profile: updatedProfile, error };
  };

  const updateAuthEmail = async (email: string) => {
    const { user: updatedUser, error } = await authRepository.updateUserEmail(
      email
    );
    return { user: updatedUser, error };
  };

  // Valor actualizado que incluye isSigningOut
  const value = {
    session,
    user,
    profile,
    role,
    isLoading,
    isSigningOut,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfileData,
    updateAuthEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
