/**
 * Image Service
 * 
 * Handles image uploads with intelligent storage strategy:
 * 1. Supabase Storage (for authenticated users - PREFERRED)
 * 2. Compressed base64 (fallback for development/testing)
 * 
 * Storage bucket: coin-images (public read, authenticated write)
 */

import { supabase } from "@/integrations/supabase/client";

interface UploadResult {
  url: string;
  isBase64: boolean;
}

/**
 * Compress image to reduce file size
 */
const compressImage = async (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Resize if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const base64 = canvas.toDataURL("image/jpeg", quality);
        
        // Calculate size in KB
        const sizeKB = Math.round((base64.length * 3) / 4 / 1024);
        console.log(`🖼️ Image compressed: ${sizeKB}KB (quality: ${quality * 100}%)`);
        
        // If still too large (>100KB), compress more aggressively
        if (sizeKB > 100 && quality > 0.5) {
          console.warn(`⚠️ Image too large (${sizeKB}KB). Compressing more aggressively...`);
          compressImage(file, maxWidth, 0.5).then(resolve).catch(reject);
          return;
        }
        
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload image to Supabase Storage
 */
const uploadToSupabase = async (file: File, folder: string): Promise<string | null> => {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn("⚠️ User not authenticated. Cannot upload to Supabase Storage.");
      return null;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    console.log(`📤 Uploading to Supabase Storage: ${fileName}`);

    const { data, error } = await supabase.storage
      .from("coin-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      console.error("❌ Supabase Storage upload failed:", error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("coin-images")
      .getPublicUrl(data.path);

    console.log("✅ Image uploaded to Supabase Storage:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("❌ Unexpected error uploading to Supabase:", error);
    return null;
  }
};

export const imageService = {
  /**
   * Upload image with automatic storage selection
   * 1. Try Supabase Storage (if authenticated)
   * 2. Fallback to compressed base64
   */
  uploadImage: async (file: File, folder = "coins"): Promise<UploadResult> => {
    console.log(`📤 Uploading image: ${file.name} (${Math.round(file.size / 1024)}KB)`);

    // Try Supabase Storage first
    const supabaseUrl = await uploadToSupabase(file, folder);
    if (supabaseUrl) {
      return { url: supabaseUrl, isBase64: false };
    }

    // Fallback to compressed base64
    console.warn("⚠️ Supabase Storage upload failed, using compressed base64 fallback");
    try {
      const base64 = await compressImage(file);
      const sizeKB = Math.round((base64.length * 3) / 4 / 1024);
      console.log(`✅ Using compressed base64 (${sizeKB}KB)`);
      return { url: base64, isBase64: true };
    } catch (error) {
      console.error("❌ Image compression failed:", error);
      throw new Error("Failed to process image");
    }
  },

  /**
   * Delete image from Supabase Storage
   * (base64 images are stored with coin data, no separate deletion needed)
   */
  deleteImage: async (imageUrl: string): Promise<void> => {
    // Skip deletion for base64 images
    if (imageUrl.startsWith("data:")) {
      console.log("ℹ️ Skipping deletion of base64 image");
      return;
    }

    // Extract path from Supabase Storage URL
    try {
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/coin-images\/(.+)$/);
      
      if (pathMatch) {
        const filePath = pathMatch[1];
        const { error } = await supabase.storage
          .from("coin-images")
          .remove([filePath]);

        if (error) {
          console.warn("⚠️ Failed to delete image from Supabase Storage:", error);
        } else {
          console.log("✅ Image deleted from Supabase Storage");
        }
      }
    } catch (error) {
      console.warn("⚠️ Failed to delete image:", error);
    }
  }
};