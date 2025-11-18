import React from "react";
import { Stack } from "expo-router";

/**
 * Layout para el grupo (guest)
 * Define un Stack de navegación para las pantallas de invitado.
 * Ocultamos el header por defecto.
 */
export default function GuestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="explore" />
      {/* Aquí irá la pantalla de "detalle-plan" más adelante */}
    </Stack>
  );
}
