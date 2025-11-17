import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MisPlanesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Pantalla Mis Planes</Text>
      <Text>Aquí irá el historial de contrataciones.</Text>
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
