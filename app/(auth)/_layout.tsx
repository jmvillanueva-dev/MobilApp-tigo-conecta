import React from "react";
import { Stack } from "expo-router";

/**
 * Layout para el grupo (auth)
 * Define un Stack de navegación para las pantallas de login y registro.
 * Ocultamos el header por defecto para que cada pantalla lo maneje.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
