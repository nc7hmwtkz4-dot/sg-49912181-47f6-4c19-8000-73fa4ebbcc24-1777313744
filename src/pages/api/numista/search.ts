import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

// Numista API configuration
const NUMISTA_API_KEY = "f6SfCMjxvgXzgim62WqWUpVH63G4ME3kre1kPjB";
const NUMISTA_API_URL = "https://api.numista.com/api/v3/coins";

// Metal mapping from Numista to our database enum
const metalMapping: Record<string, string> = {
  "gold": "Gold",
  "silver": "Silver",
  "platinum": "Platinum",
  "palladium": "Palladium",
  "copper": "Copper",
  "nickel": "Nickel",
  "bronze": "Copper",
  "brass": "Copper",
  "aluminum": "Other",
  "iron": "Other",
  "steel": "Other",
  "zinc": "Other",
  "tin": "Other"
};

interface NumistaComposition {
  metal?: string;
  purity?: number;
}

interface NumistaCoin {
  id: number;
  title: string;
  issuer: {
    code: string;
    name: string;
  };
  min_year?: number;
  max_year?: number;
  composition?: NumistaComposition;
  weight?: number;
  obverse_thumbnail?: string;
  reverse_thumbnail?: string;
}

interface SearchResponse {
  source: "local" | "numista" | "none";
  data: any[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { q, userId } = req.query;

  // Validation: minimum 3 characters
  if (!q || typeof q !== "string" || q.length < 3) {
    return res.status(400).json({ 
      error: "Veuillez entrer au moins 3 caractères pour la recherche." 
    });
  }

  try {
    // STEP 1: Search in local database first (coins_reference)
    console.log(`[Numista Search] Searching locally for: "${q}"`);
    
    const { data: localResults, error: localError } = await supabase
      .from("coins_reference")
      .select("*")
      .or(`title.ilike.%${q}%,country_code.ilike.%${q}%`)
      .limit(20);

    if (localError) {
      console.error("[Numista Search] Local search error:", localError);
    }

    // If we have local results, return them immediately
    if (localResults && localResults.length > 0) {
      console.log(`[Numista Search] Found ${localResults.length} results locally`);
      return res.json({
        source: "local",
        data: localResults
      });
    }

    // STEP 2: Nothing found locally? Query Numista API
    console.log("[Numista Search] No local results, querying Numista API...");

    const numistaResponse = await fetch(
      `${NUMISTA_API_URL}/search?q=${encodeURIComponent(q)}&lang=fr`,
      {
        headers: {
          "Numista-API-Key": NUMISTA_API_KEY,
          "Accept": "application/json"
        }
      }
    );

    if (!numistaResponse.ok) {
      const errorText = await numistaResponse.text();
      console.error("[Numista Search] API error:", numistaResponse.status, errorText);
      return res.status(numistaResponse.status).json({ 
        error: `Erreur API Numista: ${numistaResponse.status}` 
      });
    }

    const numistaData = await numistaResponse.json();
    const numistaCoins: NumistaCoin[] = numistaData.items || [];

    if (!numistaCoins || numistaCoins.length === 0) {
      console.log("[Numista Search] No results from Numista");
      return res.json({
        source: "none",
        data: []
      });
    }

    console.log(`[Numista Search] Found ${numistaCoins.length} results from Numista`);

    // STEP 3: Save new coins to local database before returning
    const newlySavedCoins = [];

    for (const coin of numistaCoins) {
      try {
        // Check if this numista_id already exists
        const { data: existing } = await supabase
          .from("coins_reference")
          .select("id")
          .eq("numista_id", coin.id)
          .maybeSingle();

        if (existing) {
          console.log(`[Numista Search] Coin ${coin.id} already exists, skipping`);
          continue;
        }

        // Map Numista metal to our enum
        const metal = coin.composition?.metal 
          ? metalMapping[coin.composition.metal.toLowerCase()] || "Other"
          : "Other";

        // Prepare data for insertion
        const insertData = {
          numista_id: coin.id,
          sku: `NUMISTA-${coin.id}`, // Generate unique SKU from Numista ID
          km_number: "N/A", // Default value, could be extracted from Numista if available
          coin_name: coin.title,
          country_code: coin.issuer.code.substring(0, 2).toUpperCase(),
          year_issued: coin.min_year || null,
          metal: metal,
          purity: coin.composition?.purity || 1.0,
          weight: coin.weight || 0,
          obverse_image_url: coin.obverse_thumbnail || null,
          reverse_image_url: coin.reverse_thumbnail || null
        };

        const { data: saved, error: insertError } = await supabase
          .from("coins_reference")
          .insert(insertData)
          .select()
          .single();

        if (insertError) {
          console.error(`[Numista Search] Failed to save coin ${coin.id}:`, insertError);
        } else {
          console.log(`[Numista Search] Saved new coin: ${coin.title} (numista_id: ${coin.id})`);
          newlySavedCoins.push(saved);
        }
      } catch (err) {
        console.error(`[Numista Search] Error processing coin ${coin.id}:`, err);
      }
    }

    console.log(`[Numista Search] Saved ${newlySavedCoins.length} new coins to database`);

    // STEP 4: Return the newly saved coins
    return res.json({
      source: "numista",
      data: newlySavedCoins
    });

  } catch (error) {
    console.error("[Numista Search] Server error:", error);
    return res.status(500).json({ 
      error: "Erreur serveur lors de la recherche" 
    });
  }
}