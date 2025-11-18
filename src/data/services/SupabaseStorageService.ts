import { supabase } from "./supabaseClient";

export class SupabaseStorageService {
  private static BUCKET_NAME = "planes-imagenes";

  static async uploadImage(
    uri: string
  ): Promise<{ url: string | null; error: any }> {
    try {
      // 1. Preparar FormData para React Native
      const formData = new FormData();

      // Obtenemos la extensión
      const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // IMPORTANTE: React Native necesita estos 3 campos: uri, name, type
      formData.append("file", {
        uri: uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any); // 'as any' es necesario por discrepancias de tipos en RN

      // 2. Subir usando el método upload estándar pero pasando formData
      const { data, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, formData, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase Upload Error:", uploadError);
        return { url: null, error: uploadError };
      }

      // 3. Obtener URL Pública
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      return { url: urlData.publicUrl, error: null };
    } catch (error: any) {
      console.error("Service Upload Error:", error);
      return { url: null, error };
    }
  }

  static async deleteImageByUrl(imageUrl: string): Promise<{ error: any }> {
    try {
      const path = imageUrl.split(`${this.BUCKET_NAME}/`).pop();
      if (!path) return { error: "URL inválida" };

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      return { error };
    } catch (error) {
      return { error };
    }
  }
}
