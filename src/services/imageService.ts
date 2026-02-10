/**
 * Image Service
 * 
 * Handles image uploads with automatic fallback:
 * 1. First tries Supabase Storage (if properly configured)
 * 2. Falls back to base64 encoding for local storage (works immediately)
 * 
 * To enable Supabase Storage uploads:
 * 1. Go to Supabase Dashboard → Storage
 * 2. Create bucket "coin-images" (public)
 * 3. Add RLS policies for authenticated users
 */

import { supabase } from "@/integrations/supabase/client";

export const imageService = {
  /**
   * Upload an image file with automatic fallback to base64
   * @param file - The image file to upload
   * @param folder - Optional folder path (e.g., 'coins')
   * @returns The public URL or base64 data URL of the image
   */
  uploadImage: async (file: File, folder: string = "coins"): Promise<string> => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      // If authenticated, try Supabase Storage upload
      if (session) {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${folder}/${fileName}`;

          const { data, error } = await supabase.storage
            .from("coin-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false
            });

          if (!error && data) {
            const { data: urlData } = supabase.storage
              .from("coin-images")
              .getPublicUrl(filePath);

            console.log("✅ Image uploaded to Supabase Storage:", urlData.publicUrl);
            return urlData.publicUrl;
          }
        } catch (storageError) {
          console.warn("⚠️ Supabase Storage upload failed, using base64 fallback:", storageError);
        }
      }

      // Fallback: Convert to base64 for local storage
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          console.log("✅ Image converted to base64 (local storage)");
          resolve(base64String);
        };
        reader.onerror = () => {
          console.error("❌ Failed to convert image to base64");
          reject(new Error("Failed to convert image to base64"));
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error("❌ Image upload failed completely:", error);
      throw error;
    }
  },

  /**
   * Delete an image from Supabase Storage
   * @param imageUrl - The public URL of the image to delete
   */
  deleteImage: async (imageUrl: string): Promise<void> => {
    try {
      // Skip deletion for base64 images
      if (imageUrl.startsWith("data:image")) {
        console.log("ℹ️ Skipping deletion of base64 image");
        return;
      }

      // Extract file path from URL
      const urlParts = imageUrl.split("/storage/v1/object/public/coin-images/");
      if (urlParts.length !== 2) {
        console.warn("⚠️ Invalid image URL format, skipping deletion");
        return;
      }

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from("coin-images")
        .remove([filePath]);

      if (error) {
        console.error("❌ Error deleting image from Supabase:", error);
      } else {
        console.log("✅ Image deleted from Supabase Storage");
      }
    } catch (error) {
      console.warn("⚠️ Failed to delete image:", error);
    }
  }
};