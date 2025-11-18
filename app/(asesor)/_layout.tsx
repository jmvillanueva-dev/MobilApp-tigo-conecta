import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

/**
 * Layout principal para el 'Asesor Comercial'
 */
export default function AsesorTabLayout() {

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#007AFF", // Azul Tigo
        tabBarInactiveTintColor: "#8E8E93", // Gris
        headerStyle: {
          backgroundColor: "#0D47A1", // Azul Tigo oscuro
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      {/* 1. Pestaña Principal: Gestión de Planes (index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Planes",
          headerTitle: "Panel de Asesor",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Pestaña Solicitudes */}
      <Tabs.Screen
        name="solicitudes"
        options={{
          title: "Solicitudes",
          headerTitle: "Solicitudes de Contratación",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 3. Pestaña Chats */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chats",
          headerTitle: "Conversaciones",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 4. Pestaña Perfil */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          headerTitle: "Mi Perfil (Asesor)",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* --- RUTA OCULTA: Formulario de Planes --- 
         Usamos 'href: null' para que no aparezca en la barra de abajo.
      */}
      <Tabs.Screen
        name="plan-form"
        options={{
          href: null, // <--- ESTO LA OCULTA DEL MENÚ
          headerShown: false, // Ocultamos el header del Tab para usar el propio de la pantalla
          tabBarStyle: { display: "none" }, // Opcional: Oculta la barra inferior al entrar aquí
        }}
      />

      {/* Si tenías 'explore.tsx' y ya no lo usas, puedes eliminar el archivo 
         o añadirlo aquí también con href: null si quieres conservarlo oculto.
      */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
