import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/presentation/contexts/AuthContext";
import { Text } from "react-native";

/**
 * Layout principal para el 'Usuario Registrado'
 * Define la navegación por pestañas (Tabs)
 */
export default function UserTabLayout() {
  const { profile } = useAuth();
  const headerTitle = profile?.full_name
    ? `Hola, ${profile.full_name.split(" ")[0]}`
    : "Tigo Conecta";

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#007AFF", // Azul Tigo
        tabBarInactiveTintColor: "#8E8E93", // Gris
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: React.ComponentProps<typeof Ionicons>["name"] =
            "alert-circle";

          if (route.name === "index") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "mis-planes") {
            iconName = focused ? "cart" : "cart-outline";
          } else if (route.name === "chat") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else if (route.name === "perfil") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerStyle: {
          backgroundColor: "#0D47A1", // Azul Tigo oscuro
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          headerTitle: headerTitle,
        }}
      />
      <Tabs.Screen
        name="mis-planes"
        options={{
          title: "Mis Planes",
          headerTitle: "Mis Contrataciones",
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerTitle: "Chat con Asesor",
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          headerTitle: "Mi Perfil",
        }}
      />
    </Tabs>
  );
}
