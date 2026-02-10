/**
 * Image Service
 * 
 * Handles image uploads with intelligent storage strategy:
 * 1. Compresses images to reduce size
 * 2. Small images (< 100KB): Base64 in localStorage
 * 3. Large images: Server-side upload to /uploads folder
 * 
 * To enable Supabase Storage (recommended for production):
 * Go to Database Console → Storage section → Configure coin-images bucket
 */

import { supabase } from "@/integrations/supabase/client";

interface CompressionResult {
  dataUrl: string;
  sizeKB: number;
  wasCompressed: boolean;
}

export const imageService = {
  /**
   * Compress image to reduce size for storage
   */
  compressImage: async (file: File, maxSizeKB: number = 100, quality: number = 0.7): Promise<CompressionResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions (max 800px width for thumbnails)
          const maxWidth = 800;
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
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels to meet size target
          let currentQuality = quality;
          let dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
          let sizeKB = (dataUrl.length * 3) / 4 / 1024; // Approximate size in KB
          
          // Reduce quality if still too large
          while (sizeKB > maxSizeKB && currentQuality > 0.1) {
            currentQuality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
            sizeKB = (dataUrl.length * 3) / 4 / 1024;
          }
          
          console.log(`🖼️ Image compressed: ${Math.round(sizeKB)}KB (quality: ${Math.round(currentQuality * 100)}%)`);
          
          resolve({
            dataUrl,
            sizeKB,
            wasCompressed: true
          });
        };
        
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Upload image with automatic compression and storage selection
   * @param file - The image file to upload
   * @param folder - Optional folder path (e.g., 'coins')
   * @returns The image URL or base64 data URL
   */
  uploadImage: async (file: File, folder: string = "coins"): Promise<string> => {
    try {
      console.log(`📤 Uploading image: ${file.name} (${Math.round(file.size / 1024)}KB)`);
      
      // Check if user is authenticated for Supabase Storage
      const { data: { session } } = await supabase.auth.getSession();
      
      // Try Supabase Storage first if authenticated
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
          } else {
            console.warn("⚠️ Supabase Storage upload failed:", error?.message);
          }
        } catch (storageError) {
          console.warn("⚠️ Supabase Storage error:", storageError);
        }
      }

      // Fallback: Compress image for localStorage
      const compressed = await imageService.compressImage(file, 100, 0.7);
      
      if (compressed.sizeKB < 100) {
        console.log(`✅ Using compressed base64 (${Math.round(compressed.sizeKB)}KB)`);
        return compressed.dataUrl;
      } else {
        // Image still too large even after compression
        console.warn(`⚠️ Image too large (${Math.round(compressed.sizeKB)}KB). Using heavily compressed version.`);
        const heavyCompressed = await imageService.compressImage(file, 50, 0.5);
        return heavyCompressed.dataUrl;
      }
    } catch (error) {
      console.error("❌ Image upload failed:", error);
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