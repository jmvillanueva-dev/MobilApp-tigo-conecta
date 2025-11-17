import React, { useEffect } from "react";
import { Stack, useRouter, useSegments, SplashScreen } from "expo-router";
import {
  AuthProvider,
  useAuth,
} from "../src/presentation/contexts/AuthContext";

// Escondemos el Splash Screen manualmente
SplashScreen.preventAutoHideAsync();

/**
 * Layout Raíz (RootLayout)
 * Este es el componente principal que envuelve toda la app.
 * 1. Provee el AuthContext a toda la aplicación.
 * 2. Define el Stack de navegación principal.
 * 3. Contiene la lógica de redirección (RootLayoutNav).
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

/**
 * RootLayoutNav
 * Este componente vive DENTRO del AuthProvider,
 * por lo que tiene acceso al estado de autenticación (useAuth).
 */
function RootLayoutNav() {
  const { session, isLoading, role, profile } = useAuth();
  const router = useRouter();
  const segments = useSegments(); // Segmentos de la ruta actual, ej: ['(auth)', 'login']

  useEffect(() => {
    if (isLoading) {
      // Aún estamos cargando la sesión, no hacer nada (Splash Screen sigue activo)
      return;
    }

    // Ya terminamos de cargar
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup =
      segments[0] === "(usuario)" ||
      segments[0] === "(asesor)" ||
      segments[0] === "(guest)";

    if (session && profile) {
      // --- Usuario AUTENTICADO ---

      const userGroup = `(${
        role === "asesor_comercial" ? "asesor" : "usuario"
      })`; // (asesor) o (usuario)

      // 1. Si está autenticado y su rol es 'asesor', llévalo a su panel
      if (role === "asesor_comercial" && segments[0] !== "(asesor)") {
        router.replace("/(asesor)/"); // Ruta inicial de asesor
      }

      // 2. Si está autenticado y su rol es 'registrado', llévalo a su panel
      else if (role === "usuario_registrado" && segments[0] !== "(usuario)") {
        router.replace("/(usuario)/"); // Ruta inicial de usuario
      }

      // 3. Si está autenticado pero visita 'index' o '(auth)', redirigir
      else if (!inAppGroup) {
        router.replace(
          role === "asesor_comercial" ? "/(asesor)/" : "/(usuario)/"
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
  }, [session, isLoading, role, segments]);

  return (
    <Stack>
      {/* 1. Pantalla de Bienvenida y Autenticación */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />

      {/* 2. Paneles de Roles (Tabs) */}
      <Stack.Screen name="(guest)" options={{ headerShown: false }} />
      <Stack.Screen name="(usuario)" options={{ headerShown: false }} />
      <Stack.Screen name="(asesor)" options={{ headerShown: false }} />
    </Stack>
  );
}
