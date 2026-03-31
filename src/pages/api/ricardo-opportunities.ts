import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { ricardoService } from "@/services/ricardoService";

/**
 * API endpoint to fetch and process Ricardo coin opportunities
 * This endpoint should be called twice daily (via cron job or manual trigger)
 * 
 * TODO: Set up automatic scheduling:
 * - Vercel Cron (if using Vercel)
 * - Supabase Edge Function with pg_cron
 * - External cron service
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests (to prevent accidental triggers)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("=== Ricardo Opportunities Fetch Started ===");
    console.log("Timestamp:", new Date().toISOString());

    // Step 1: Search Ricardo for coin listings
    console.log("Step 1: Fetching listings from Ricardo...");
    const listings = await ricardoService.searchCoins();
    console.log(`Found ${listings.length} listings`);

    if (listings.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No listings found",
        processed: 0,
        opportunities: 0,
      });
    }

    // Step 2: Process each listing
    console.log("Step 2: Processing listings...");
    const opportunities = [];
    const errors = [];

    for (const listing of listings) {
      try {
        // Match to SKU
        const sku = await ricardoService.matchToSku(listing);
        
        // Calculate opportunity
        const opportunity = await ricardoService.calculateOpportunity(listing, sku || undefined);
        
        // Only save if it's a good opportunity (≤ melt value + 10%)
        if (opportunity.opportunityScore && opportunity.opportunityScore <= 110) {
          opportunities.push(opportunity);
          
          // Save to database
          await saveOpportunityToDatabase(opportunity);
        }
      } catch (error) {
        console.error(`Error processing listing ${listing.id}:`, error);
        errors.push({
          listingId: listing.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Step 3: Clean up old/expired listings
    console.log("Step 3: Cleaning up expired listings...");
    await cleanupExpiredOpportunities();

    console.log("=== Ricardo Opportunities Fetch Completed ===");
    console.log(`Processed: ${listings.length}, Opportunities: ${opportunities.length}, Errors: ${errors.length}`);

    return res.status(200).json({
      success: true,
      processed: listings.length,
      opportunities: opportunities.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("Ricardo opportunities fetch error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Saves an opportunity to the database
 * TODO: Create the database table first (see migration below)
 */
async function saveOpportunityToDatabase(opportunity: any) {
  try {
    const { error } = await supabase
      .from("ricardo_opportunities")
      .upsert({
        listing_id: opportunity.listing.id,
        title: opportunity.listing.title,
        description: opportunity.listing.description,
        current_price: opportunity.listing.currentPrice,
        currency: opportunity.listing.currency,
        end_date: opportunity.listing.endDate,
        image_url: opportunity.listing.imageUrl,
        listing_url: opportunity.listing.url,
        matched_sku: opportunity.matchedSku,
        melt_value: opportunity.meltValue,
        opportunity_score: opportunity.opportunityScore,
        collection_status: opportunity.collectionStatus,
        last_checked: new Date().toISOString(),
      }, {
        onConflict: "listing_id",
      });

    if (error) {
      console.error("Error saving opportunity:", error);
    }
  } catch (error) {
    console.error("Error in saveOpportunityToDatabase:", error);
  }
}

/**
 * Removes expired opportunities from the database
 */
async function cleanupExpiredOpportunities() {
  try {
    const { error } = await supabase
      .from("ricardo_opportunities")
      .delete()
      .lt("end_date", new Date().toISOString());

    if (error) {
      console.error("Error cleaning up opportunities:", error);
    }
  } catch (error) {
    console.error("Error in cleanupExpiredOpportunities:", error);
  }
}