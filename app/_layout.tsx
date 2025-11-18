import React, { useEffect } from "react";
import { Stack, useRouter, useSegments, SplashScreen } from "expo-router";
import {
  AuthProvider,
  useAuth,
} from "../src/presentation/contexts/AuthContext";
import { NotificationProvider } from "../src/presentation/contexts/NotificationContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RootLayoutNav />
      </NotificationProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { session, isLoading, role, profile, isSigningOut } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // No hacer nada si está cargando O cerrando sesión
    if (isLoading || isSigningOut) {
      return;
    }

    // Ya terminamos de cargar y no estamos cerrando sesión
    SplashScreen.hideAsync();

    const inAppGroup =
      segments[0] === "(usuario)" ||
      segments[0] === "(asesor)" ||
      segments[0] === "(guest)";

    if (session && profile) {
      // --- Usuario AUTENTICADO ---
      // 1. Si está autenticado y su rol es 'asesor', llévalo a su panel
      if (role === "asesor_comercial" && segments[0] !== "(asesor)") {
        router.replace("/(asesor)");
      }
      // 2. Si está autenticado y su rol es 'registrado', llévalo a su panel
      else if (role === "usuario_registrado" && segments[0] !== "(usuario)") {
        router.replace("/(usuario)");
      }
      // 3. Si está autenticado pero visita 'index' o '(auth)', redirigir
      else if (!inAppGroup) {
        router.replace(
          role === "asesor_comercial" ? "/(asesor)" : "/(usuario)"
        );
      }
    } else {
      // --- Usuario NO AUTENTICADO (Invitado) ---

      // 1. Si no está autenticado y está en una ruta protegida, llévalo al inicio
      if (segments[0] === "(asesor)" || segments[0] === "(usuario)") {
        router.replace("/");
      }
      // Si está en 'index' o '(auth)' o '(guest)', se queda ahí.
    }
  }, [session, isLoading, role, segments, profile, isSigningOut, router]); 

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(guest)" options={{ headerShown: false }} />
      <Stack.Screen name="(usuario)" options={{ headerShown: false }} />
      <Stack.Screen name="(asesor)" options={{ headerShown: false }} />
    </Stack>
  );
}
