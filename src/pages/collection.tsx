import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import Image from "next/image";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { userCoinService } from "@/services/userCoinService";
import { userSalesService } from "@/services/userSalesService";
import { coinReferenceService } from "@/services/coinReferenceService";
import { spotPriceService } from "@/lib/spotPrices";
import type { SpotPrices } from "@/lib/spotPrices";
import { imageService } from "@/services/imageService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Package, ShoppingCart } from "lucide-react";
import { SheldonGrade, SHELDON_GRADES, COUNTRY_CODES } from "@/types/coin";
import type { Coin } from "@/types/coin";

export default function Collection() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);
  const [obverseImageFile, setObverseImageFile] = useState<File | null>(null);
  const [reverseImageFile, setReverseImageFile] = useState<File | null>(null);
  const [obverseImagePreview, setObverseImagePreview] = useState<string>("");
  const [reverseImagePreview, setReverseImagePreview] = useState<string>("");
  
  // Reference coin search state
  const [referenceSearchTerm, setReferenceSearchTerm] = useState("");
  const [referenceSearchResults, setReferenceSearchResults] = useState<Array<{ sku: string; coin_name: string; country_code: string; km_number: string; metal: string; purity: number; weight: number; obverse_image_url?: string; reverse_image_url?: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Coin>>({
    countryCode: "US",
    metal: "silver",
    purity: 90
  });

  // Purchase dialog state
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [purchaseFormData, setPurchaseFormData] = useState<{
    sku: string;
    coinName: string;
    countryCode: string;
    kmNumber: string;
    metal: string;
    purity: number;
    weight: number;
    obverseImageUrl: string;
    reverseImageUrl: string;
    year: number;
    mintmark: string;
    sheldonGrade: SheldonGrade;
    purchaseDate: string;
    purchasePrice: number;
    notes: string;
  }>({
    sku: "",
    coinName: "",
    countryCode: "",
    kmNumber: "",
    metal: "",
    purity: 0,
    weight: 0,
    obverseImageUrl: "",
    reverseImageUrl: "",
    year: new Date().getFullYear(),
    mintmark: "",
    sheldonGrade: "MS-63" as SheldonGrade,
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: 0,
    notes: ""
  });

  // Sale dialog state
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [availableCoinsForSale, setAvailableCoinsForSale] = useState<Coin[]>([]);
  const [selectedCoinForSale, setSelectedCoinForSale] = useState("");
  const [saleFormData, setSaleFormData] = useState<{
    coinId: string;
    saleDate: string;
    salePrice: number;
    buyerInfo: string;
    notes: string;
  }>({
    coinId: "",
    saleDate: new Date().toISOString().split("T")[0],
    salePrice: 0,
    buyerInfo: "",
    notes: ""
  });

  // Register purchase dialog state
  const [isRegisterPurchaseOpen, setIsRegisterPurchaseOpen] = useState(false);
  const [isRegisteringPurchase, setIsRegisteringPurchase] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    sku: "",
    coinName: "",
    countryCode: "",
    kmNumber: "",
    metal: "",
    purity: 0,
    weight: 0,
    year: 0,
    mintmark: "",
    sheldonGrade: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: 0,
    quantity: 1,
    notes: ""
  });
  
  // Reference coins for Register Purchase
  const [availableReferences, setAvailableReferences] = useState<any[]>([]);
  const [referenceFilter, setReferenceFilter] = useState("");
  const [isLoadingReferences, setIsLoadingReferences] = useState(false);

  // Image viewer state
  const [viewImage, setViewImage] = useState<{ url: string; alt: string } | null>(null);

  const loadCoins = async () => {
    setIsLoading(true);
    
    // Check if user is authenticated first
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setCoins([]);
      setFilteredCoins([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await userCoinService.getUserCoins();
    
    if (error) {
      console.error("Error loading coins:", error);
      setIsLoading(false);
      return;
    }

    if (data) {
      // Map database coins to frontend Coin type
      const mappedCoins: Coin[] = data.map((coin: any) => ({
        id: coin.id,
        sku: coin.sku,
        coinName: coin.coin_name || "",
        countryCode: coin.country_code,
        kmNumber: coin.km_number,
        year: coin.year,
        mintmark: coin.mintmark || "",
        metal: coin.metal as "gold" | "silver" | "copper" | "platinum" | "palladium" | "other",
        purity: coin.purity,
        weight: coin.weight,
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
    setIsLoading(false);
  };

  useEffect(() => {
    loadCoins();
    loadSpotPrices();
  }, []);

  useEffect(() => {
    let filtered = coins;
    
    if (searchTerm) {
      filtered = filtered.filter(coin => 
        coin.coinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (countryFilter !== "all") {
      filtered = filtered.filter(coin => coin.countryCode === countryFilter);
    }
    
    if (metalFilter !== "all") {
      filtered = filtered.filter(coin => coin.metal === metalFilter);
    }
    
    setFilteredCoins(filtered);
  }, [searchTerm, countryFilter, metalFilter, coins]);

  const loadSpotPrices = async () => {
    const prices = await spotPriceService.getSpotPrices();
    setSpotPrices(prices);
    console.log("Loaded spot prices:", prices);
  };

  const calculateBullionValue = (coin: Coin): number => {
    if (!spotPrices) return 0;
    return spotPriceService.calculateBullionValue(
      coin.weight,
      coin.purity,
      coin.metal,
      spotPrices
    );
  };

  const handleObverseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setObverseImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setObverseImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReverseImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReverseImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReverseImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Select reference coin from search results
  const handleSelectReference = (reference: { sku: string; coin_name: string; country_code: string; km_number: string; metal: string; purity: number; weight: number; obverse_image_url?: string; reverse_image_url?: string }) => {
    setFormData({
      countryCode: reference.country_code,
      kmNumber: reference.km_number,
      coinName: reference.coin_name,
      metal: reference.metal as "gold" | "silver" | "copper" | "platinum" | "palladium" | "other",
      purity: reference.purity,
      weight: reference.weight,
      obverseImageUrl: reference.obverse_image_url ?? "",
      reverseImageUrl: reference.reverse_image_url ?? ""
    });
    setReferenceSearchTerm("");
    setReferenceSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.countryCode || !formData.kmNumber || !formData.metal || 
        !formData.purity || !formData.weight || !formData.coinName) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      let obverseImageUrl = formData.obverseImageUrl || "";
      let reverseImageUrl = formData.reverseImageUrl || "";
      
      // Upload obverse image
      if (obverseImageFile) {
        const result = await imageService.uploadImage(obverseImageFile);
        obverseImageUrl = result.url;
      }

      // Upload reverse image
      if (reverseImageFile) {
        const result = await imageService.uploadImage(reverseImageFile);
        reverseImageUrl = result.url;
      }

      const sku = `${formData.countryCode}-${formData.kmNumber}`;

      // Check if reference coin exists
      const { data: existingRef } = await coinReferenceService.getReferenceBySKU(sku);

      if (!existingRef) {
        // Create reference coin first
        const { error: refError } = await coinReferenceService.createReference({
          sku,
          coin_name: formData.coinName ?? "",
          country_code: formData.countryCode ?? "",
          km_number: formData.kmNumber ?? "",
          metal: (formData.metal as "gold" | "silver" | "copper" | "platinum" | "palladium" | "other") ?? "silver",
          purity: formData.purity ?? 0,
          weight: formData.weight ?? 0,
          obverse_image_url: obverseImageUrl || null,
          reverse_image_url: reverseImageUrl || null
        });

        if (refError) {
          alert("Failed to create reference coin. Please try again.");
          console.error("Reference creation error:", refError);
          return;
        }
      }

      alert(`Reference coin ${sku} created successfully! Use "Register Purchase" to add individual coins.`);
      await loadCoins();
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error saving reference coin:", error);
      alert("Failed to save reference coin. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      countryCode: "US",
      metal: "silver",
      purity: 90
    });
    setObverseImageFile(null);
    setReverseImageFile(null);
    setObverseImagePreview("");
    setReverseImagePreview("");
    setReferenceSearchTerm("");
    setReferenceSearchResults([]);
  };

  // Handle Register Purchase
  const handleRegisterPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerFormData.sku) {
      alert("Please select a SKU.");
      return;
    }

    if (registerFormData.quantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    try {
      setIsRegisteringPurchase(true);

      // Fetch the reference coin to get images
      const { data: refCoin, error: refError } = await coinReferenceService.getReferenceBySKU(registerFormData.sku);
      
      if (refError || !refCoin) {
        throw new Error("Failed to fetch reference coin details");
      }

      const baseCoinData = {
        sku: registerFormData.sku,
        coin_name: registerFormData.coinName,
        country_code: registerFormData.countryCode,
        km_number: registerFormData.kmNumber,
        metal: registerFormData.metal,
        purity: registerFormData.purity,
        weight: registerFormData.weight,
        year: registerFormData.year,
        mintmark: registerFormData.mintmark || "",
        grade: registerFormData.sheldonGrade,
        purchase_date: registerFormData.purchaseDate,
        purchase_price: registerFormData.purchasePrice,
        notes: registerFormData.notes || "",
        obverse_image_url: refCoin.obverse_image_url || "",
        reverse_image_url: refCoin.reverse_image_url || "",
        is_sold: false
      };

      // Create multiple entries based on quantity
      const insertPromises = [];
      for (let i = 0; i < registerFormData.quantity; i++) {
        insertPromises.push(userCoinService.addUserCoin(baseCoinData));
      }

      const results = await Promise.all(insertPromises);
      
      // Check if any insertion failed
      const failedInserts = results.filter(result => result.error);
      if (failedInserts.length > 0) {
        throw new Error(`Failed to register ${failedInserts.length} coin(s)`);
      }

      alert(`Successfully registered ${registerFormData.quantity} coin(s)!`);
      
      // Close dialog and reset form
      setIsRegisterPurchaseOpen(false);
      setRegisterFormData({
        sku: "",
        coinName: "",
        countryCode: "",
        kmNumber: "",
        metal: "",
        purity: 0,
        weight: 0,
        year: 0,
        mintmark: "",
        sheldonGrade: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        purchasePrice: 0,
        quantity: 1,
        notes: ""
      });
      setReferenceFilter("");
      
      // Refresh the collection
      await loadCoins();
    } catch (err) {
      console.error("Error registering purchase:", err);
      alert("Failed to register purchase. Please try again.");
    } finally {
      setIsRegisteringPurchase(false);
    }
  };

  // Handle Add Purchase (adding another coin to existing SKU)
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddPurchaseOpen(false);
  };

  // Load available reference coins for Register Purchase
  const loadAvailableReferences = async () => {
    setIsLoadingReferences(true);
    const { data, error } = await coinReferenceService.getAllReferences();
    
    if (error) {
      console.error("Error loading reference coins:", error);
    } else if (data) {
      setAvailableReferences(data);
    }
    setIsLoadingReferences(false);
  };

  // Filter reference coins based on search
  const filteredReferences = useMemo(() => {
    if (!availableReferences || availableReferences.length === 0) return [];
    if (!referenceFilter) return availableReferences;
    
    const searchLower = referenceFilter.toLowerCase();
    return availableReferences.filter((ref: any) => {
      // Safely check each property with null checks
      const sku = ref?.sku?.toLowerCase() || '';
      const coinName = ref?.coin_name?.toLowerCase() || '';
      const kmNumber = ref?.km_number?.toLowerCase() || '';
      const metal = ref?.metal?.toLowerCase() || '';
      const countryCode = ref?.country_code?.toLowerCase() || '';
      
      return sku.includes(searchLower) ||
             coinName.includes(searchLower) ||
             kmNumber.includes(searchLower) ||
             metal.includes(searchLower) ||
             countryCode.includes(searchLower);
    });
  }, [availableReferences, referenceFilter]);

  const handleCoinSelection = (coinId: string) => {
    const coin = availableCoinsForSale.find(c => c.id === coinId);
    if (coin) {
      setSelectedCoinForSale(coinId);
      setSaleFormData({
        ...saleFormData,
        coinId: coinId,
        salePrice: calculateBullionValue(coin)
      });
    }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!saleFormData.coinId) {
      alert("Please select a coin to sell");
      return;
    }

    const coin = coins.find(c => c.id === saleFormData.coinId);
    if (!coin) return;

    try {
      // Create sale record
      const { error: saleError } = await userSalesService.addSale({
        coin_id: coin.id,
        sku: coin.sku,
        coin_name: coin.coinName,
        sale_date: saleFormData.saleDate,
        sale_price: Number(saleFormData.salePrice),
        buyer_info: saleFormData.buyerInfo || "",
        notes: saleFormData.notes || "",
        purchase_price: coin.purchasePrice,
        profit: Number(saleFormData.salePrice) - coin.purchasePrice,
        markup_percentage: ((Number(saleFormData.salePrice) - coin.purchasePrice) / coin.purchasePrice) * 100
      });

      if (saleError) {
        alert("Failed to record sale. Please try again.");
        console.error("Sale error:", saleError);
        return;
      }

      // Mark coin as sold
      const { error: updateError } = await userCoinService.updateUserCoin(saleFormData.coinId, {
        is_sold: true
      });

      if (updateError) {
        alert("Failed to update coin status. Please try again.");
        console.error("Update error:", updateError);
        return;
      }

      await loadCoins();
      setIsSaleDialogOpen(false);
      setSaleFormData({
        coinId: "",
        saleDate: new Date().toISOString().split("T")[0],
        salePrice: 0,
        buyerInfo: "",
        notes: ""
      });
      setSelectedCoinForSale("");
      setAvailableCoinsForSale([]);
    } catch (err) {
      console.error("Error recording sale:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const handleViewDetails = (skuCoins: Coin[]) => {
    if (skuCoins.length > 0) {
      router.push(`/coin/${encodeURIComponent(skuCoins[0].sku)}`);
    }
  };

  // Group coins by SKU
  const groupedCoins = filteredCoins.reduce((acc, coin) => {
    if (!acc[coin.sku]) {
      acc[coin.sku] = [];
    }
    acc[coin.sku].push(coin);
    return acc;
  }, {} as Record<string, Coin[]>);

  const uniqueCountries = Array.from(new Set(coins.map(c => c.countryCode))).sort();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Layout>
        <SEO 
          title="Inventory - NumiVault"
          description="Manage your numismatic collection"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading your collection...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title="Inventory - NumiVault"
        description="Manage your numismatic collection"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Inventory
            </h1>
            <p className="text-slate-400 text-lg">
              {coins.length} coins in collection
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add SKU
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-white">
                    Add New Coin Reference (SKU)
                  </DialogTitle>
                  <p className="text-slate-400 text-sm">
                    Define the coin type specifications. Individual coins are added via "Register Purchase" button.
                  </p>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Search existing reference coins */}
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <Label htmlFor="referenceSearch" className="text-slate-300 mb-2 block">
                      Search Existing Coins
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="referenceSearch"
                        value={referenceSearchTerm}
                        onChange={(e) => setReferenceSearchTerm(e.target.value)}
                        placeholder="Search by name, country, or KM number..."
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    {referenceSearchResults.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                        {referenceSearchResults.map((ref) => (
                          <button
                            key={ref.sku}
                            type="button"
                            onClick={() => handleSelectReference(ref)}
                            className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-medium">{ref.coin_name}</p>
                                <p className="text-slate-400 text-sm">{ref.sku}</p>
                              </div>
                              <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                                {ref.metal}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Country Code and KM Number on first line */}
                    <div>
                      <Label htmlFor="countryCode" className="text-slate-300">Country Code *</Label>
                      <Select 
                        value={formData.countryCode} 
                        onValueChange={(value) => setFormData({...formData, countryCode: value})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                          {Object.entries(COUNTRY_CODES).map(([code, name]) => (
                            <SelectItem key={code} value={code} className="text-white">
                              {code} - {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="kmNumber" className="text-slate-300">KM Number *</Label>
                      <Input
                        id="kmNumber"
                        value={formData.kmNumber || ""}
                        onChange={(e) => setFormData({...formData, kmNumber: e.target.value})}
                        placeholder="e.g., 24 or 35.2"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    {/* Coin Name on second line */}
                    <div className="col-span-2">
                      <Label htmlFor="coinName" className="text-slate-300">Coin Name *</Label>
                      <Input
                        id="coinName"
                        value={formData.coinName || ""}
                        onChange={(e) => setFormData({...formData, coinName: e.target.value})}
                        placeholder="e.g., 5 Francs - Léopold II petit..."
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="metal" className="text-slate-300">Metal *</Label>
                      <Select 
                        value={formData.metal} 
                        onValueChange={(value) => setFormData({...formData, metal: value as any})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="gold" className="text-white">Gold</SelectItem>
                          <SelectItem value="silver" className="text-white">Silver</SelectItem>
                          <SelectItem value="copper" className="text-white">Copper</SelectItem>
                          <SelectItem value="platinum" className="text-white">Platinum</SelectItem>
                          <SelectItem value="palladium" className="text-white">Palladium</SelectItem>
                          <SelectItem value="other" className="text-white">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="purity" className="text-slate-300">Purity (%) *</Label>
                      <Input
                        id="purity"
                        type="number"
                        step="0.01"
                        value={formData.purity || ""}
                        onChange={(e) => setFormData({...formData, purity: parseFloat(e.target.value)})}
                        placeholder="e.g., 90"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="weight" className="text-slate-300">Weight (grams) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight || ""}
                        onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value)})}
                        placeholder="e.g., 25.0"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="obverseImageUpload" className="text-slate-300">Obverse Image (Front)</Label>
                      <div className="space-y-2">
                        <Input
                          id="obverseImageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleObverseImageChange}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                        {(obverseImagePreview || formData.obverseImageUrl) && (
                          <div className="mt-2">
                            <Image 
                              src={obverseImagePreview || formData.obverseImageUrl || ""} 
                              alt="Obverse Preview" 
                              width={128}
                              height={128}
                              className="w-32 h-32 object-cover rounded-lg border-2 border-slate-700"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="reverseImageUpload" className="text-slate-300">Reverse Image (Back)</Label>
                      <div className="space-y-2">
                        <Input
                          id="reverseImageUpload"
                          type="file"
                          accept="image/*"
                          onChange={handleReverseImageChange}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                        {(reverseImagePreview || formData.reverseImageUrl) && (
                          <div className="mt-2">
                            <Image 
                              src={reverseImagePreview || formData.reverseImageUrl || ""} 
                              alt="Reverse Preview" 
                              width={128}
                              height={128}
                              className="w-32 h-32 object-cover rounded-lg border-2 border-slate-700"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-600 text-slate-300">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-white text-slate-900 hover:bg-slate-100">
                      {isSubmitting ? "Creating..." : "Create Reference Coin"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Register Purchase Dialog */}
            <Dialog open={isRegisterPurchaseOpen} onOpenChange={(open) => {
              setIsRegisterPurchaseOpen(open);
              if (open) {
                loadAvailableReferences();
              }
            }}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="flex items-center gap-2 border-slate-600 text-slate-300">
                  <ShoppingCart className="h-5 w-5" />
                  Register Purchase
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Register Coin Purchase</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Select an existing SKU and add purchase details for a coin in your collection.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRegisterPurchase} className="space-y-6">
                  {/* SKU Selection with Search */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="register-sku-search" className="text-slate-300">Search & Select SKU *</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="register-sku-search"
                          value={referenceFilter}
                          onChange={(e) => setReferenceFilter(e.target.value)}
                          placeholder="Search by SKU, name, country, or KM number..."
                          className="pl-10 bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Show loading state */}
                    {isLoadingReferences && (
                      <p className="text-slate-400 text-sm">Loading reference coins...</p>
                    )}

                    {/* Show filtered results */}
                    {!isLoadingReferences && filteredReferences.length > 0 && (
                      <div className="border border-slate-700 rounded-lg max-h-60 overflow-y-auto bg-slate-800/50">
                        {filteredReferences.map((ref) => (
                          <button
                            key={ref.sku}
                            type="button"
                            onClick={() => {
                              setRegisterFormData({
                                ...registerFormData,
                                sku: ref.sku || "",
                                coinName: ref.coin_name || "",
                                countryCode: ref.country_code || "",
                                kmNumber: ref.km_number || "",
                                metal: ref.metal || "",
                                purity: ref.purity || 0,
                                weight: ref.weight || 0
                              });
                              setReferenceFilter("");
                            }}
                            className={`w-full text-left p-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 ${
                              registerFormData.sku === ref.sku ? 'bg-slate-700' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-white font-medium">{ref.coin_name || 'Unknown Coin'}</p>
                                <p className="text-slate-400 text-sm">{ref.sku || 'N/A'}</p>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="bg-slate-600 text-slate-200 text-xs">
                                  {ref.country_code || 'N/A'}
                                </Badge>
                                <Badge variant="secondary" className="bg-slate-600 text-slate-200 text-xs capitalize">
                                  {ref.metal || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Show no results message */}
                    {!isLoadingReferences && referenceFilter && filteredReferences.length === 0 && (
                      <p className="text-slate-400 text-sm">No reference coins found. Try a different search term.</p>
                    )}

                    {/* Show selected coin details */}
                    {registerFormData.sku && (
                      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-2 text-sm">
                        <p className="text-white font-semibold mb-2">Selected Coin:</p>
                        <p className="text-slate-400"><strong className="text-white">SKU:</strong> {registerFormData.sku}</p>
                        <p className="text-slate-400"><strong className="text-white">Name:</strong> {registerFormData.coinName}</p>
                        <p className="text-slate-400"><strong className="text-white">Country:</strong> {COUNTRY_CODES[registerFormData.countryCode] || registerFormData.countryCode}</p>
                        <p className="text-slate-400"><strong className="text-white">KM#:</strong> {registerFormData.kmNumber}</p>
                        <p className="text-slate-400"><strong className="text-white">Metal:</strong> {registerFormData.metal} ({registerFormData.purity}%)</p>
                        <p className="text-slate-400"><strong className="text-white">Weight:</strong> {registerFormData.weight}g</p>
                      </div>
                    )}
                  </div>

                  {/* Purchase Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-year" className="text-slate-300">Year *</Label>
                      <Input
                        id="register-year"
                        type="number"
                        value={registerFormData.year || ""}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, year: parseInt(e.target.value) || 0 })}
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="register-mintmark" className="text-slate-300">Mintmark</Label>
                      <Input
                        id="register-mintmark"
                        value={registerFormData.mintmark}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, mintmark: e.target.value })}
                        placeholder="Optional"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-grade" className="text-slate-300">Sheldon Grade *</Label>
                    <Select 
                      value={registerFormData.sheldonGrade} 
                      onValueChange={(value) => setRegisterFormData({ ...registerFormData, sheldonGrade: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                        {SHELDON_GRADES.map(grade => (
                          <SelectItem key={grade} value={grade} className="text-white">
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-purchase-date" className="text-slate-300">Purchase Date *</Label>
                      <Input
                        id="register-purchase-date"
                        type="date"
                        value={registerFormData.purchaseDate}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, purchaseDate: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="register-purchase-price" className="text-slate-300">Purchase Price (CHF) *</Label>
                      <Input
                        id="register-purchase-price"
                        type="number"
                        step="0.01"
                        value={registerFormData.purchasePrice || ""}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, purchasePrice: parseFloat(e.target.value) || 0 })}
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-quantity" className="text-slate-300">Quantity *</Label>
                    <Input
                      id="register-quantity"
                      type="number"
                      min="1"
                      value={registerFormData.quantity}
                      onChange={(e) => setRegisterFormData({ ...registerFormData, quantity: parseInt(e.target.value) || 1 })}
                      className="bg-slate-800 border-slate-700 text-white"
                      required
                    />
                    <p className="text-slate-500 text-xs mt-1">
                      Number of identical coins to register (will create {registerFormData.quantity} individual {registerFormData.quantity === 1 ? 'entry' : 'entries'})
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="register-notes" className="text-slate-300">Notes</Label>
                    <Textarea
                      id="register-notes"
                      value={registerFormData.notes}
                      onChange={(e) => setRegisterFormData({ ...registerFormData, notes: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                      placeholder="Optional notes about this coin"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                    <Button type="button" variant="outline" onClick={() => setIsRegisterPurchaseOpen(false)} className="border-slate-600 text-slate-300">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isRegisteringPurchase || !registerFormData.sku} className="bg-white text-slate-900 hover:bg-slate-100">
                      {isRegisteringPurchase ? "Registering..." : "Register Purchase"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">All Countries</SelectItem>
              {uniqueCountries.map(code => (
                <SelectItem key={code} value={code} className="text-white">
                  {COUNTRY_CODES[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={metalFilter} onValueChange={setMetalFilter}>
            <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="All Metals" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-white">All Metals</SelectItem>
              <SelectItem value="gold" className="text-white">Gold</SelectItem>
              <SelectItem value="silver" className="text-white">Silver</SelectItem>
              <SelectItem value="copper" className="text-white">Copper</SelectItem>
              <SelectItem value="platinum" className="text-white">Platinum</SelectItem>
              <SelectItem value="palladium" className="text-white">Palladium</SelectItem>
              <SelectItem value="other" className="text-white">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Country Sections */}
        <div className="space-y-8">
          {uniqueCountries
            .filter(code => countryFilter === "all" || code === countryFilter)
            .map(countryCode => {
              const countryCoins = Object.entries(groupedCoins)
                .filter(([_, coins]) => coins[0].countryCode === countryCode)
                .map(([sku, coins]) => ({ sku, coins }));
              
              if (countryCoins.length === 0) return null;

              return (
                <div key={countryCode}>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary" className="bg-slate-700 text-slate-200 px-3 py-1 text-sm font-medium">
                      {countryCode}
                    </Badge>
                    <h2 className="text-xl font-semibold text-slate-300">
                      {COUNTRY_CODES[countryCode]}
                    </h2>
                    <span className="text-slate-500">{countryCoins.reduce((sum, {coins}) => sum + coins.length, 0)} coins</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {countryCoins.map(({ sku, coins: coinBySku }) => {
                      const coin = coinBySku[0];
                      const unsoldCoins = coinBySku.filter(c => !c.isSold);
                      const totalBullionValue = unsoldCoins.reduce((sum, c) => sum + calculateBullionValue(c), 0);
                      const totalCost = unsoldCoins.reduce((sum, c) => sum + c.purchasePrice, 0);

                      return (
                        <Card 
                          key={sku} 
                          className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors overflow-hidden group"
                        >
                          <div 
                            className="relative bg-slate-900/50 overflow-hidden cursor-pointer"
                            onClick={() => router.push(`/coin/${encodeURIComponent(sku)}`)}
                          >
                            {coin.obverseImageUrl || coin.reverseImageUrl ? (
                              <div className="grid grid-cols-2 gap-0.5 p-0.5">
                                {coin.obverseImageUrl ? (
                                  <div className="relative aspect-square bg-slate-900/50 overflow-hidden">
                                    <Image 
                                      src={coin.obverseImageUrl} 
                                      alt={`${coin.coinName || sku} - Obverse`}
                                      fill
                                      className="object-contain p-1"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-square flex items-center justify-center bg-slate-800/50">
                                    <Package className="w-8 h-8 text-slate-700" />
                                  </div>
                                )}
                                {coin.reverseImageUrl ? (
                                  <div className="relative aspect-square bg-slate-900/50 overflow-hidden">
                                    <Image 
                                      src={coin.reverseImageUrl} 
                                      alt={`${coin.coinName || sku} - Reverse`}
                                      fill
                                      className="object-contain p-1"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-square flex items-center justify-center bg-slate-800/50">
                                    <Package className="w-8 h-8 text-slate-700" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="aspect-square w-full flex items-center justify-center">
                                <Package className="w-16 h-16 text-slate-700" />
                              </div>
                            )}
                            <div className="absolute top-2 left-2 flex gap-2">
                              <Badge className="bg-slate-900/80 text-slate-200 border-0">
                                {coin.countryCode}
                              </Badge>
                              <Badge className="bg-slate-900/80 text-slate-200 border-0 capitalize">
                                {coin.metal}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardContent className="p-4 space-y-2">
                            <div 
                              className="cursor-pointer"
                              onClick={() => router.push(`/coin/${encodeURIComponent(sku)}`)}
                            >
                              <h3 className="text-white font-semibold line-clamp-2 min-h-[3rem]">
                                {coin.coinName || `${COUNTRY_CODES[coin.countryCode]} Coin`}
                              </h3>
                              <p className="text-slate-400 text-sm mb-2">
                                {coin.sku}
                              </p>
                              
                              <div className="flex items-center gap-2 pt-2">
                                <Package className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-400 text-sm">
                                  {unsoldCoins.length} in collection
                                </span>
                              </div>

                              <div className="pt-3 border-t border-slate-700 space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xl font-bold text-white">
                                    {spotPriceService.formatCHF(totalBullionValue)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">
                                    {spotPriceService.formatCHF(totalCost)} cost
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                onClick={() => handleViewDetails(coinBySku)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {filteredCoins.length === 0 && (
            <Card className="bg-slate-800/30 border-slate-700 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-slate-400 text-lg mb-4">
                  {searchTerm || countryFilter !== "all" || metalFilter !== "all" 
                    ? "No coins found matching your filters" 
                    : "No coins in your collection yet"}
                </p>
                {!searchTerm && countryFilter === "all" && metalFilter === "all" && (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Coin
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Purchase Dialog */}
      <Dialog open={isAddPurchaseOpen} onOpenChange={setIsAddPurchaseOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-900 dark:text-white">Add Coin Purchase</DialogTitle>
            {purchaseFormData.coinName && (
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
                {purchaseFormData.coinName} ({purchaseFormData.sku})
              </p>
            )}
          </DialogHeader>
          
          <form onSubmit={handleAddPurchase} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseYear" className="text-slate-700 dark:text-slate-300">Year *</Label>
                <Input
                  id="purchaseYear"
                  type="number"
                  value={purchaseFormData.year}
                  onChange={(e) => setPurchaseFormData({...purchaseFormData, year: parseInt(e.target.value)})}
                  placeholder="e.g., 1879"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="purchaseMintmark" className="text-slate-700 dark:text-slate-300">Mintmark</Label>
                <Input
                  id="purchaseMintmark"
                  value={purchaseFormData.mintmark}
                  onChange={(e) => setPurchaseFormData({...purchaseFormData, mintmark: e.target.value})}
                  placeholder="e.g., D, S, P (optional)"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="purchaseSheldonGrade" className="text-slate-700 dark:text-slate-300">Sheldon Grade *</Label>
                <Select 
                  value={purchaseFormData.sheldonGrade} 
                  onValueChange={(value) => setPurchaseFormData({...purchaseFormData, sheldonGrade: value as SheldonGrade})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 max-h-60">
                    {SHELDON_GRADES.map(grade => (
                      <SelectItem key={grade} value={grade} className="text-slate-900 dark:text-white">
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purchasePurchaseDate" className="text-slate-700 dark:text-slate-300">Purchase Date *</Label>
                <Input
                  id="purchasePurchaseDate"
                  type="date"
                  value={purchaseFormData.purchaseDate}
                  onChange={(e) => setPurchaseFormData({...purchaseFormData, purchaseDate: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="purchasePurchasePrice" className="text-slate-700 dark:text-slate-300">Purchase Price (CHF) *</Label>
                <Input
                  id="purchasePurchasePrice"
                  type="number"
                  step="0.01"
                  value={purchaseFormData.purchasePrice || ""}
                  onChange={(e) => setPurchaseFormData({...purchaseFormData, purchasePrice: parseFloat(e.target.value)})}
                  placeholder="e.g., 19.06"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="purchaseNotes" className="text-slate-700 dark:text-slate-300">Notes</Label>
                <Textarea
                  id="purchaseNotes"
                  value={purchaseFormData.notes}
                  onChange={(e) => setPurchaseFormData({...purchaseFormData, notes: e.target.value})}
                  placeholder="Additional notes about this specific coin"
                  rows={3}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddPurchaseOpen(false)}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                Add to Collection
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Sale Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">
              Record Sale
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleRecordSale} className="space-y-4">
            {availableCoinsForSale.length > 1 && (
              <div>
                <Label htmlFor="saleCoinId" className="text-slate-300">Select Coin *</Label>
                <Select 
                  value={saleFormData.coinId} 
                  onValueChange={handleCoinSelection}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select a coin to sell" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    {availableCoinsForSale.map(coin => (
                      <SelectItem key={coin.id} value={coin.id} className="text-white">
                        {coin.year} {coin.mintmark && `(${coin.mintmark})`} - {coin.sheldonGrade} - {spotPriceService.formatCHF(coin.purchasePrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="saleSaleDate" className="text-slate-300">Sale Date *</Label>
                <Input
                  id="saleSaleDate"
                  type="date"
                  value={saleFormData.saleDate}
                  onChange={(e) => setSaleFormData({...saleFormData, saleDate: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="saleSalePrice" className="text-slate-300">Sale Price (CHF) *</Label>
                <Input
                  id="saleSalePrice"
                  type="number"
                  step="0.01"
                  value={saleFormData.salePrice}
                  onChange={(e) => setSaleFormData({...saleFormData, salePrice: parseFloat(e.target.value)})}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="saleBuyerInfo" className="text-slate-300">Buyer Information</Label>
                <Input
                  id="saleBuyerInfo"
                  value={saleFormData.buyerInfo}
                  onChange={(e) => setSaleFormData({...saleFormData, buyerInfo: e.target.value})}
                  placeholder="Optional buyer details"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="saleNotes" className="text-slate-300">Notes</Label>
                <Textarea
                  id="saleNotes"
                  value={saleFormData.notes}
                  onChange={(e) => setSaleFormData({...saleFormData, notes: e.target.value})}
                  placeholder="Additional information"
                  rows={3}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {selectedCoinForSale && availableCoinsForSale.find(c => c.id === selectedCoinForSale) && (
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Purchase Price:</span>
                  <span className="text-white font-medium">
                    {spotPriceService.formatCHF(availableCoinsForSale.find(c => c.id === selectedCoinForSale)?.purchasePrice ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sale Price:</span>
                  <span className="text-white font-medium">{spotPriceService.formatCHF(saleFormData.salePrice)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                  <span className="text-slate-400">Profit:</span>
                  <span className={`font-bold ${saleFormData.salePrice - (availableCoinsForSale.find(c => c.id === selectedCoinForSale)?.purchasePrice ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {spotPriceService.formatCHF(saleFormData.salePrice - (availableCoinsForSale.find(c => c.id === selectedCoinForSale)?.purchasePrice ?? 0))}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
              <Button type="button" variant="outline" onClick={() => setIsSaleDialogOpen(false)} className="border-slate-600 text-slate-300">
                Cancel
              </Button>
              <Button type="submit" className="bg-white text-slate-900 hover:bg-slate-100">
                Record Sale
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}