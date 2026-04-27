import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { GroupedCoinTable } from "@/components/coin/GroupedCoinTable";
import { FilterBar } from "@/components/coin/FilterBar";
import { StatisticsPanel } from "@/components/coin/StatisticsPanel";
import { CoinSearchModal } from "@/components/coin/CoinSearchModal";
import { SaleCheckoutModal } from "@/components/coin/SaleCheckoutModal";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { userCoinService } from "@/services/userCoinService";
import { supabase } from "@/integrations/supabase/client";
import type { CoinWithReference } from "@/types/coin";
import { useToast } from "@/hooks/use-toast";

export default function Collection() {
  const router = useRouter();
  const { toast } = useToast();
  const [coins, setCoins] = useState<CoinWithReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    metal: "all",
    status: "all",
    sortBy: "purchase_date" as const,
    sortOrder: "desc" as const,
  });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedCoinForSale, setSelectedCoinForSale] = useState<CoinWithReference | null>(null);

  const filteredCoins = useMemo(() => {
    return coins.filter(coin => {
      const matchesSearch = filters.search === "" || 
        coin.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
        coin.coinName.toLowerCase().includes(filters.search.toLowerCase()) ||
        coin.countryCode.toLowerCase().includes(filters.search.toLowerCase());
      const matchesMetal = filters.metal === "all" || coin.metal === filters.metal;
      const matchesStatus = filters.status === "all" || coin.isSold === (filters.status === "sold");
      
      return matchesSearch && matchesMetal && matchesStatus;
    });
  }, [coins, filters]);

  const sortedCoins = useMemo(() => {
    return [...filteredCoins].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (filters.sortBy) {
        case "purchase_date":
          aVal = a.purchaseDate;
          bVal = b.purchaseDate;
          break;
        case "coin_name":
          aVal = a.coinName;
          bVal = b.coinName;
          break;
        case "sku":
          aVal = a.sku;
          bVal = b.sku;
          break;
        case "metal":
          aVal = a.metal;
          bVal = b.metal;
          break;
        case "purity":
          aVal = a.purity;
          bVal = b.purity;
          break;
        case "weight":
          aVal = a.weight;
          bVal = b.weight;
          break;
        case "grade":
          aVal = a.sheldonGrade;
          bVal = b.sheldonGrade;
          break;
        case "obverse_image_url":
          aVal = a.obverseImageUrl;
          bVal = b.obverseImageUrl;
          break;
        case "reverse_image_url":
          aVal = a.reverseImageUrl;
          bVal = b.reverseImageUrl;
          break;
        case "is_sold":
          aVal = a.isSold;
          bVal = b.isSold;
          break;
      }
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return filters.sortOrder === "desc" ? -comparison : comparison;
    });
  }, [filteredCoins, filters]);

  const handleSellCoin = (coin: CoinWithReference) => {
    setSelectedCoinForSale(coin);
    setSaleModalOpen(true);
  };

  const handleSaleCompleted = () => {
    loadCoins(); // Refresh the collection after sale
    toast({
      title: "Vente enregistrée",
      description: "La pièce a été marquée comme vendue"
    });
  };

  const loadCoins = async () => {
    setLoading(true);
    
    // Check if user is authenticated first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setCoins([]);
      setFilteredCoins([]);
      setLoading(false);
      return;
    }

    const { data, error } = await userCoinService.getUserCoins();
    
    if (error) {
      console.error("Error loading coins:", error);
      setLoading(false);
      return;
    }

    if (data) {
      // Map database coins to frontend Coin type
      const mappedCoins: CoinWithReference[] = data.map((coin) => ({
        id: coin.id,
        referenceCoinId: coin.reference_coin_id,
        sku: coin.sku,
        coinName: coin.coin_name || "",
        countryCode: coin.country_code,
        kmNumber: coin.coins_reference?.km_number || "",
        year: coin.year,
        mintmark: coin.mintmark || "",
        metal: (coin.coins_reference?.metal || "other") as "gold" | "silver" | "copper" | "platinum" | "palladium" | "other",
        purity: coin.coins_reference?.purity || 0,
        weight: coin.coins_reference?.weight || 0,
        sheldonGrade: coin.grade as SheldonGrade,
        purchasePrice: coin.purchase_price,
        purchaseDate: coin.purchase_date,
        notes: coin.notes || "",
        obverseImageUrl: coin.obverse_image_url || "",
        reverseImageUrl: coin.reverse_image_url || "",
        isSold: coin.is_sold,
        listingId: coin.listing_id || undefined
      }));
      
      setCoins(mappedCoins);
      setFilteredCoins(mappedCoins);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCoins();
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
            <StatisticsPanel coins={filteredCoins} />
            <FilterBar filters={filters} onFiltersChange={setFilters} />
            <GroupedCoinTable 
              coins={sortedCoins}
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