import { supabase } from "@/integrations/supabase/client";

export const imageService = {
  /**
   * Upload an image file to Supabase Storage
   * @param file - The image file to upload
   * @param folder - Optional folder path (e.g., 'coins')
   * @returns The public URL of the uploaded image
   */
  uploadImage: async (file: File, folder: string = "coins"): Promise<string> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("coin-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (error) {
        console.error("Error uploading image:", error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("coin-images")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Failed to upload image:", error);
      throw error;
    }
  },

  /**
   * Delete an image from Supabase Storage
   * @param imageUrl - The public URL of the image to delete
   */
  deleteImage: async (imageUrl: string): Promise<void> => {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split("/storage/v1/object/public/coin-images/");
      if (urlParts.length !== 2) {
        console.error("Invalid image URL format");
        return;
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from("coin-images")
        .remove([filePath]);

      if (error) {
        console.error("Error deleting image:", error);
        throw error;
      }
    } catch (error) {
      console.error("Failed to delete image:", error);
      throw error;
    }
  }
};