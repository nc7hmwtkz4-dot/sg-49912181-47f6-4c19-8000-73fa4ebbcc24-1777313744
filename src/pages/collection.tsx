import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { FilterBar, type FilterState } from "@/components/coin/FilterBar";
import { StatisticsPanel } from "@/components/coin/StatisticsPanel";
import { CoinSearchModal } from "@/components/coin/CoinSearchModal";
import { SaleCheckoutModal } from "@/components/coin/SaleCheckoutModal";
import { GalleryView } from "@/components/coin/GalleryView";
import { ListView } from "@/components/coin/ListView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, LayoutGrid, Table as TableIcon } from "lucide-react";
import { userCoinService } from "@/services/userCoinService";
import { supabase } from "@/integrations/supabase/client";
import type { Coin, SheldonGrade } from "@/types/coin";
import { useToast } from "@/hooks/use-toast";
import { spotPriceService } from "@/lib/spotPrices";

export default function Collection() {
  const router = useRouter();
  const { toast } = useToast();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [spotPrices, setSpotPrices] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<"gallery" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("collection_view_mode") as "gallery" | "list") || "gallery";
    }
    return "gallery";
  });
  
  const initialFilters: FilterState = {
    grades: [],
    status: "all",
    dateRange: "all"
  };
  
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState<"year-asc" | "year-desc" | "date-newest" | "date-oldest" | "price-low" | "price-high" | "grade" | "best-to-sell" | "profit">("year-desc");
  
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedCoinForSale, setSelectedCoinForSale] = useState<Coin | null>(null);

  // Save view mode preference
  const handleViewModeChange = (mode: "gallery" | "list") => {
    setViewMode(mode);
    localStorage.setItem("collection_view_mode", mode);
  };

  const handleSellCoin = (coin: Coin) => {
    setSelectedCoinForSale(coin);
    setSaleModalOpen(true);
  };

  const handleSaleCompleted = () => {
    loadData();
    toast({
      title: "Vente enregistrée",
      description: "La pièce a été marquée comme vendue avec succès."
    });
  };

  const loadData = async () => {
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setCoins([]);
      setLoading(false);
      return;
    }

    const { data: coinsData, error: coinsError } = await userCoinService.getUserCoins();
    
    if (coinsError) {
      console.error("Error loading coins:", coinsError);
      setLoading(false);
      return;
    }

    if (coinsData) {
      const mappedCoins: Coin[] = coinsData.map((c) => {
        const coin = c as any;
        return {
          id: coin.id,
          referenceCoinId: coin.reference_coin_id,
          sku: coin.sku,
          coinName: coin.coins_reference?.coin_name || coin.coins_reference?.title || "",
          countryCode: coin.coins_reference?.country_code || "",
          kmNumber: coin.coins_reference?.km_number || "",
          year: coin.year,
          mintmark: coin.mintmark || "",
          metal: (coin.coins_reference?.metal || "other") as any,
          purity: coin.coins_reference?.purity || 0,
          weight: coin.coins_reference?.weight || 0,
          sheldonGrade: coin.grade as SheldonGrade,
          purchasePrice: coin.purchase_price,
          purchaseDate: coin.purchase_date,
          notes: coin.notes || "",
          obverseImageUrl: coin.coins_reference?.obverse_image_url || "",
          reverseImageUrl: coin.coins_reference?.reverse_image_url || "",
          isSold: coin.is_sold,
          listingId: coin.listing_id || undefined
        };
      });
      setCoins(mappedCoins);
    }
    
    const { data: salesResult } = await supabase.from('user_sales').select('*');
    if (salesResult) {
      setSalesData(salesResult);
    }
    
    const { data: spotData } = await supabase.from('spot_prices_cache').select('*').order('created_at', { ascending: false }).limit(1);
    if (spotData && spotData.length > 0) {
      const p = spotData[0];
      const prices: any = {
        gold: p.gold,
        silver: p.silver,
        platinum: p.platinum
      };
      setSpotPrices(prices);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateBullionValue = useCallback((coin: Coin) => {
    return spotPriceService.calculateBullionValue(coin.weight, coin.purity, coin.metal, spotPrices);
  }, [spotPrices]);

  // Filter and sort coins
  const filteredAndSortedCoins = coins
    .filter(coin => {
      if (filters.grades.length > 0 && !filters.grades.includes(coin.sheldonGrade)) return false;
      if (filters.status === "in-collection" && coin.isSold) return false;
      if (filters.status === "sold" && !coin.isSold) return false;
      
      if (filters.dateRange !== "all") {
        const purchaseDate = new Date(coin.purchaseDate);
        const now = new Date();
        
        switch (filters.dateRange) {
          case "last-week": {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (purchaseDate < weekAgo) return false;
            break;
          }
          case "last-month": {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (purchaseDate < monthAgo) return false;
            break;
          }
          case "last-3-months": {
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            if (purchaseDate < threeMonthsAgo) return false;
            break;
          }
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "year-asc": return a.year - b.year;
        case "year-desc": return b.year - a.year;
        case "date-newest": return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case "date-oldest": return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        case "price-low": return a.purchasePrice - b.purchasePrice;
        case "price-high": return b.purchasePrice - a.purchasePrice;
        case "profit": {
          const aProfit = calculateBullionValue(a) - a.purchasePrice;
          const bProfit = calculateBullionValue(b) - b.purchasePrice;
          return bProfit - aProfit;
        }
        default: return 0;
      }
    });

  return (
    <Layout>
      <SEO 
        title="Ma Collection - NumiVault"
        description="Gérez votre collection de pièces numismatiques"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold">Ma Collection</h1>
          <div className="flex gap-2">
            <Button onClick={() => setSearchModalOpen(true)} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Rechercher une pièce
            </Button>
            <Button onClick={() => router.push("/coin/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une pièce
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement de votre collection...</p>
          </div>
        ) : (
          <>
            <StatisticsPanel coins={coins} />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <FilterBar 
                filters={filters} 
                onFiltersChange={setFilters} 
                onReset={() => setFilters(initialFilters)} 
              />
              
              <div className="flex items-center gap-4">
                <select 
                  className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-[200px]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="year-desc">Année (Récents)</option>
                  <option value="year-asc">Année (Anciens)</option>
                  <option value="date-newest">Achat (Récent)</option>
                  <option value="date-oldest">Achat (Ancien)</option>
                  <option value="price-high">Prix (Haut-Bas)</option>
                  <option value="price-low">Prix (Bas-Haut)</option>
                  <option value="profit">Profit P/L</option>
                </select>
                
                <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as "gallery" | "list")}>
                  <TabsList>
                    <TabsTrigger value="gallery" className="gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Galerie
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2">
                      <TableIcon className="h-4 w-4" />
                      Liste
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            {viewMode === "gallery" ? (
              <GalleryView
                coins={filteredAndSortedCoins}
                onEditCoin={(coin) => router.push(`/coin/${coin.sku}`)}
                onDeleteCoin={async (id) => {
                  if (confirm("Voulez-vous vraiment supprimer cette pièce ?")) {
                    await supabase.from('user_coins').delete().eq('id', id);
                    loadData();
                  }
                }}
                onSellCoin={handleSellCoin}
                calculateBullionValue={calculateBullionValue}
              />
            ) : (
              <ListView
                coins={filteredAndSortedCoins}
                onEditCoin={(coin) => router.push(`/coin/${coin.sku}`)}
                onDeleteCoin={async (id) => {
                  if (confirm("Voulez-vous vraiment supprimer cette pièce ?")) {
                    await supabase.from('user_coins').delete().eq('id', id);
                    loadData();
                  }
                }}
                onSellCoin={handleSellCoin}
                calculateBullionValue={calculateBullionValue}
              />
            )}
          </>
        )}
        
        <CoinSearchModal 
          open={searchModalOpen} 
          onOpenChange={setSearchModalOpen}
          onCoinSelected={(coin) => {
            router.push(`/coin/new?ref=${coin.id}`);
          }}
        />

        <SaleCheckoutModal
          open={saleModalOpen}
          onOpenChange={setSaleModalOpen}
          coin={selectedCoinForSale}
          onSaleCompleted={handleSaleCompleted}
        />
      </div>
    </Layout>
  );
}