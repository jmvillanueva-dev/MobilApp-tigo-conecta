import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SupabasePlanRepository } from "../../src/data/repositories/SupabasePlanRepository";
import { SupabaseStorageService } from "../../src/data/services/SupabaseStorageService";

export default function PlanFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // --- Campos Principales ---
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [gigas, setGigas] = useState("");
  const [minutos, setMinutos] = useState("");
  const [promocion, setPromocion] = useState("");
  const [activo, setActivo] = useState(true);
  const [segmento, setSegmento] = useState("");
  const [publicoObjetivo, setPublicoObjetivo] = useState("");

  // --- Campos JSONB (Detalles Técnicos) ---
  const [datosMoviles, setDatosMoviles] = useState("");
  const [minutosVoz, setMinutosVoz] = useState("");
  const [sms, setSms] = useState("");
  const [velocidad4g, setVelocidad4g] = useState("");
  const [redesSociales, setRedesSociales] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [llamadasInt, setLlamadasInt] = useState("");
  const [roaming, setRoaming] = useState("");

  // --- Imagen ---
  const [imageUri, setImageUri] = useState<string | null>(null); // URI (local o remota) para vista previa
  const [hasNewImage, setHasNewImage] = useState(false); // Si se seleccionó una nueva
  const [imageRemoved, setImageRemoved] = useState(false); // --- NUEVO: Si se presionó eliminar
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null); // URL original (para borrarla)

  const planRepository = new SupabasePlanRepository();

  useEffect(() => {
    if (isEditing) {
      setInitialLoading(true);
      const fetchPlan = async () => {
        const { plan, error } = await planRepository.getPlanById(id);
        if (error || !plan) {
          Alert.alert("Error", "No se pudo cargar el plan.");
          router.back();
          return;
        }

        setNombre(plan.nombre);
        setPrecio(plan.precio.toString());
        setDescripcion(plan.descripcion_corta || "");
        setGigas(plan.gigas_num ? plan.gigas_num.toString() : "");
        setMinutos(plan.minutos_num ? plan.minutos_num.toString() : "");
        setPromocion(plan.promocion || "");
        setActivo(plan.activo);
        setSegmento(plan.segmento || "");
        setPublicoObjetivo(plan.publico_objetivo || "");

        if (plan.imagen_url) {
          setImageUri(plan.imagen_url);
          setOldImageUrl(plan.imagen_url);
        } else {
          setImageUri(null);
          setOldImageUrl(null);
        }

        if (plan.detalles_tecnicos) {
          const dt = plan.detalles_tecnicos;
          setDatosMoviles(dt.datos_moviles || "");
          setMinutosVoz(dt.minutos_voz || "");
          setSms(dt.sms || "");
          setVelocidad4g(dt.velocidad_4g || "");
          setRedesSociales(dt.redes_sociales || "");
          setWhatsapp(dt.whatsapp || "");
          setLlamadasInt(dt.llamadas_internacionales || "");
          setRoaming(dt.roaming || "");
        } else {
          setDatosMoviles("");
          setMinutosVoz("");
          setSms("");
          setVelocidad4g("");
          setRedesSociales("");
          setWhatsapp("");
          setLlamadasInt("");
          setRoaming("");
        }

        // Resetear estados de imagen al cargar
        setImageRemoved(false);
        setHasNewImage(false);
        setInitialLoading(false);
      };
      fetchPlan();
    } else {
      // MODO CREACIÓN: Limpiar todo
      setNombre("");
      setPrecio("");
      setDescripcion("");
      setGigas("");
      setMinutos("");
      setPromocion("");
      setActivo(true);
      setSegmento("");
      setPublicoObjetivo("");
      setDatosMoviles("");
      setMinutosVoz("");
      setSms("");
      setVelocidad4g("");
      setRedesSociales("");
      setWhatsapp("");
      setLlamadasInt("");
      setRoaming("");
      setImageUri(null);
      setHasNewImage(false);
      setImageRemoved(false);
      setOldImageUrl(null);
      setInitialLoading(false);
    }
  }, [id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setHasNewImage(true);
      setImageRemoved(false); // Si sube nueva, no la está eliminando
    }
  };

  // --- NUEVA FUNCIÓN ---
  const handleRemoveImage = () => {
    Alert.alert(
      "Eliminar Imagen",
      "¿Estás seguro de que deseas eliminar la imagen de este plan?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setImageUri(null); // Limpia la vista previa
            setHasNewImage(false); // Cancela subida pendiente
            setImageRemoved(true); // Marca para borrado en DB
          },
        },
      ]
    );
  };

  // --- LÓGICA DE GUARDADO ACTUALIZADA ---
  const handleSave = async () => {
    if (!nombre || !precio) {
      Alert.alert("Error", "Nombre y Precio son obligatorios.");
      return;
    }

    setLoading(true);
    let error = null;
    let finalImageUrl: string | null = oldImageUrl; // Inicia con la imagen original

    try {
      // --- Lógica de Imagen Actualizada ---
      // 1. Si se seleccionó una NUEVA imagen
      if (hasNewImage && imageUri) {
        const { url, error: uploadError } =
          await SupabaseStorageService.uploadImage(imageUri);
        if (uploadError) throw uploadError;

        finalImageUrl = url; // La URL final es la nueva

        // Si estábamos editando y había una imagen vieja, borrarla
        if (isEditing && oldImageUrl) {
          await SupabaseStorageService.deleteImageByUrl(oldImageUrl);
        }
      }
      // 2. Si se presionó "Eliminar" (y no se subió una nueva)
      else if (imageRemoved) {
        finalImageUrl = null; // La URL final es null

        // Si estábamos editando y había una imagen vieja, borrarla
        if (isEditing && oldImageUrl) {
          await SupabaseStorageService.deleteImageByUrl(oldImageUrl);
        }
      }
      // 3. Si no pasó nada (ni newImage ni imageRemoved), finalImageUrl se queda como oldImageUrl.

      // --- Lógica de DB (sin cambios) ---
      const detallesTecnicos = {
        datos_moviles: datosMoviles,
        minutos_voz: minutosVoz,
        sms: sms,
        velocidad_4g: velocidad4g,
        redes_sociales: redesSociales,
        whatsapp: whatsapp,
        llamadas_internacionales: llamadasInt,
        roaming: roaming,
      };

      const planData: any = {
        nombre,
        precio: parseFloat(precio),
        descripcion_corta: descripcion,
        gigas_num: gigas ? parseInt(gigas) : null,
        minutos_num: minutos ? parseInt(minutos) : null,
        promocion,
        activo,
        segmento,
        publico_objetivo: publicoObjetivo,
        imagen_url: finalImageUrl, // Se usa la URL final
        detalles_tecnicos: detallesTecnicos,
      };

      if (isEditing) {
        const res = await planRepository.updatePlan(id, planData);
        error = res.error;
      } else {
        const res = await planRepository.createPlan(planData);
        error = res.error;
      }

      if (error) throw error;

      Alert.alert("Éxito", "Plan guardado correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "No se pudo guardar el plan.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Editar Plan" : "Nuevo Plan"}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#888" />
                <Text style={styles.imageText}>Subir Imagen</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* --- NUEVO: Botones de Acción de Imagen --- */}
          {imageUri && (
            <View style={styles.imageActionsContainer}>
              <TouchableOpacity
                style={[styles.imageButton, styles.changeButton]}
                onPress={pickImage}
              >
                <Ionicons name="pencil" size={16} color="#007AFF" />
                <Text style={styles.imageButtonText}>Cambiar Imagen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageButton, styles.removeButton]}
                onPress={handleRemoveImage}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                <Text style={[styles.imageButtonText, { color: "#FF3B30" }]}>
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>Información General</Text>

          <Text style={styles.label}>Nombre del Plan *</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Plan Smart"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Precio ($) *</Text>
              <TextInput
                style={styles.input}
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Estado</Text>
              <View style={styles.switchContainer}>
                <Text style={{ marginRight: 8 }}>
                  {activo ? "Visible" : "Oculto"}
                </Text>
                <Switch
                  value={activo}
                  onValueChange={setActivo}
                  trackColor={{ true: "#34C759" }}
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Descripción Corta</Text>
          <TextInput
            style={styles.input}
            value={descripcion}
            onChangeText={setDescripcion}
          />

          <Text style={styles.label}>Promoción</Text>
          <TextInput
            style={styles.input}
            value={promocion}
            onChangeText={setPromocion}
            placeholder="Ej: Primer mes gratis"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Segmento</Text>
              <TextInput
                style={styles.input}
                value={segmento}
                onChangeText={setSegmento}
                placeholder="Básico / Premium"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Público Objetivo</Text>
              <TextInput
                style={styles.input}
                value={publicoObjetivo}
                onChangeText={setPublicoObjetivo}
                placeholder="Estudiantes, etc."
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Métricas Clave</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>GB Numéricos</Text>
              <TextInput
                style={styles.input}
                value={gigas}
                onChangeText={setGigas}
                keyboardType="numeric"
                placeholder="Ej: 5"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Minutos Numéricos</Text>
              <TextInput
                style={styles.input}
                value={minutos}
                onChangeText={setMinutos}
                keyboardType="numeric"
                placeholder="Ej: 100"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Detalles Técnicos (Ficha)</Text>

          <Text style={styles.label}>Texto Datos Móviles</Text>
          <TextInput
            style={styles.input}
            value={datosMoviles}
            onChangeText={setDatosMoviles}
            placeholder="Ej: 5 GB mensuales (4G LTE)"
          />

          <Text style={styles.label}>Texto Minutos</Text>
          <TextInput
            style={styles.input}
            value={minutosVoz}
            onChangeText={setMinutosVoz}
            placeholder="Ej: 100 minutos nacionales"
          />

          <Text style={styles.label}>SMS</Text>
          <TextInput
            style={styles.input}
            value={sms}
            onChangeText={setSms}
            placeholder="Ej: Ilimitados"
          />

          <Text style={styles.label}>Velocidad 4G</Text>
          <TextInput
            style={styles.input}
            value={velocidad4g}
            onChangeText={setVelocidad4g}
            placeholder="Ej: Hasta 50 Mbps"
          />

          <Text style={styles.label}>Redes Sociales</Text>
          <TextInput
            style={styles.input}
            value={redesSociales}
            onChangeText={setRedesSociales}
            placeholder="Ej: Facebook Gratis"
          />

          <Text style={styles.label}>WhatsApp</Text>
          <TextInput
            style={styles.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="Ej: Incluido"
          />

          <Text style={styles.label}>Llamadas Internacionales</Text>
          <TextInput
            style={styles.input}
            value={llamadasInt}
            onChangeText={setLlamadasInt}
            placeholder="Ej: $0.15/min"
          />

          <Text style={styles.label}>Roaming</Text>
          <TextInput
            style={styles.input}
            value={roaming}
            onChangeText={setRoaming}
            placeholder="Ej: No incluido"
          />

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Plan</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    backgroundColor: "#FFF",
  },
  backButton: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111" },
  content: { padding: 20, paddingBottom: 50 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingBottom: 5,
  },

  imagePicker: {
    height: 180,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderStyle: "dashed",
  },
  imagePlaceholder: { alignItems: "center" },
  imageText: { marginTop: 8, color: "#888", fontSize: 14 },
  imagePreview: { width: "100%", height: "100%", resizeMode: "cover" },

  // --- NUEVOS ESTILOS PARA BOTONES DE IMAGEN ---
  imageActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8, // Sube los botones para que estén más cerca
    marginBottom: 10,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
    marginHorizontal: 4,
  },
  changeButton: {
    backgroundColor: "#E6F2FF", // Azul claro
  },
  removeButton: {
    backgroundColor: "#FFF1F0", // Rojo claro
  },
  imageButtonText: {
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 14,
    color: "#007AFF",
  },
  // --- FIN NUEVOS ESTILOS ---

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
  },

  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: { opacity: 0.7 },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
