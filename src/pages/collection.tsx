import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { GroupedCoinTable } from "@/components/coin/GroupedCoinTable";
import { FilterBar, type FilterState } from "@/components/coin/FilterBar";
import { StatisticsPanel } from "@/components/coin/StatisticsPanel";
import { CoinSearchModal } from "@/components/coin/CoinSearchModal";
import { SaleCheckoutModal } from "@/components/coin/SaleCheckoutModal";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  
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
      const mappedCoins: Coin[] = coinsData.map((coin) => ({
        id: coin.id,
        referenceCoinId: coin.reference_coin_id,
        sku: coin.sku,
        coinName: coin.coins_reference?.coin_name || "",
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
      }));
      setCoins(mappedCoins);
    }
    
    const { data: salesResult } = await supabase.from('user_sales').select('*');
    if (salesResult) {
      setSalesData(salesResult);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateBullionValue = useCallback((coin: Coin) => {
    return spotPriceService.calculateBullionValue(coin.metal, coin.weight, coin.purity);
  }, []);

  return (
    <Layout>
      <SEO 
        title="Ma Collection - NumiVault"
        description="Gérez votre collection de pièces numismatiques"
      />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <FilterBar 
                  filters={filters} 
                  onFiltersChange={setFilters} 
                  onReset={() => setFilters(initialFilters)} 
                />
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[200px]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="year-desc">Année (Récents d'abord)</option>
                  <option value="year-asc">Année (Anciens d'abord)</option>
                  <option value="date-newest">Achat (Récent)</option>
                  <option value="date-oldest">Achat (Ancien)</option>
                  <option value="price-high">Prix (Décroissant)</option>
                  <option value="price-low">Prix (Croissant)</option>
                  <option value="grade">Grade</option>
                  <option value="profit">Profit P/L</option>
                </select>
              </div>
            </div>
            
            <GroupedCoinTable 
              coins={coins}
              filters={filters}
              salesData={salesData}
              sortBy={sortBy}
              onEditCoin={(coin) => router.push(`/coin/${coin.sku}`)}
              onDeleteCoin={async (id) => {
                if (confirm("Voulez-vous vraiment supprimer cette pièce ?")) {
                  await supabase.from('user_coins').delete().eq('id', id);
                  loadData();
                }
              }}
              onRecordSale={(id) => {
                const coin = coins.find(c => c.id === id);
                if (coin) handleSellCoin(coin);
              }}
              onCreateListing={(coin) => router.push(`/listings/new?coin=${coin.id}`)}
              onViewListing={() => router.push('/listings')}
              calculateBullionValue={calculateBullionValue}
              onSellCoin={handleSellCoin}
            />
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