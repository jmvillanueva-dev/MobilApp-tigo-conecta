import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SolicitudesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla de Solicitudes (Asesor)</Text>
      <Text>Aquí irá la lista de contrataciones pendientes.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
  },
  text: { fontSize: 18, fontWeight: "bold" },
});
