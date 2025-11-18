import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { supabase } from "../../data/services/supabaseClient";
import { useAuth } from "./AuthContext";

// Configuración global
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationContextType {
  expoPushToken: string | undefined;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>("");

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // 1. Registrar Token (Con manejo de errores silencioso)
  useEffect(() => {
    // Solo intentamos registrar si es un dispositivo físico
    if (Device.isDevice) {
      registerForPushNotificationsAsync()
        .then(async (token) => {
          setExpoPushToken(token);
          if (token && user) {
            const { error } = await supabase
              .from("profiles")
              .update({ expo_push_token: token })
              .eq("id", user.id);

            if (error)
              console.warn(
                "No se pudo guardar el token (No crítico):",
                error.message
              );
          }
        })
        .catch((err) => {
          // Capturamos el error de "projectId not found" o "Expo Go" para que no detenga la app
          console.log(
            "Nota: Las notificaciones Push Remotas no están disponibles en este entorno.",
            err.message
          );
        });
    }

    // Listeners locales (Estos funcionan incluso sin Token remoto)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notificación Local Recibida:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Usuario tocó la notificación local:", response);
        // Acceder a los datos de la notificación usando response.notification.request.content.data
        const notificationData = response.notification.request.content.data;
        if (notificationData?.contratacionId) {
          console.log("ID de contratación:", notificationData.contratacionId);
          // Aquí puedes navegar a la pantalla específica si es necesario
        }
      });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, [user]);

  // 2. Listener de Realtime -> Notificación Local (LA PARTE IMPORTANTE)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("global-messages-notification")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes_chat",
        },
        async (payload) => {
          const newMessage = payload.new;

          // Ignorar mis propios mensajes
          if (newMessage.sender_id === user.id) return;

          // Obtener nombre (Optimización: caché simple o consulta rápida)
          const { data: senderData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newMessage.sender_id)
            .single();

          const senderName = senderData?.full_name || "Nuevo Mensaje";

          // ESTO ES LO QUE FUNCIONA EN EXPO GO (Notificación Local)
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Mensaje de ${senderName}`,
              body: newMessage.contenido,
              data: { contratacionId: newMessage.contratacion_id },
              sound: "default",
            },
            trigger: null, // Inmediato
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification debe usarse dentro de un NotificationProvider"
    );
  }
  return context;
};

// Función Helper Robustecida
async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    console.log("Push Notifications requieren dispositivo físico.");
    return undefined;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permiso de notificaciones denegado.");
    return undefined;
  }

  // Intentamos obtener el token, pero manejamos el error de ProjectId
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      // Si no hay Project ID, lanzamos un error controlado para salir del try
      throw new Error("Falta Project ID para Push Remoto");
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    // Este error es esperado en Expo Go sin configurar EAS.
    // Lo ignoramos para que la app siga funcionando con Notificaciones Locales.
    console.log(
      "Modo desarrollo: Push Token remoto no disponible (Usando notificaciones locales).",
      error
    );
    return undefined;
  }
}
