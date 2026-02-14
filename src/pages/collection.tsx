import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { spotPriceService } from "@/lib/spotPrices";
import { imageService } from "@/services/imageService";
import { userCoinService } from "@/services/userCoinService";
import { userSalesService } from "@/services/userSalesService";
import { coinReferenceService } from "@/services/coinReferenceService";
import { supabase } from "@/integrations/supabase/client";
import { Coin, COUNTRY_CODES, SHELDON_GRADES, SheldonGrade } from "@/types/coin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, DollarSign, ShoppingCart, Search, Package } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ImageViewer } from "@/components/ImageViewer";

export default function Collection() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCoin, setEditingCoin] = useState<Coin | null>(null);
  const [spotPrices, setSpotPrices] = useState<any>(null);
  const [obverseImageFile, setObverseImageFile] = useState<File | null>(null);
  const [reverseImageFile, setReverseImageFile] = useState<File | null>(null);
  const [obverseImagePreview, setObverseImagePreview] = useState<string>("");
  const [reverseImagePreview, setReverseImagePreview] = useState<string>("");
  
  // Reference coin search state
  const [referenceSearchTerm, setReferenceSearchTerm] = useState("");
  const [referenceSearchResults, setReferenceSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Coin>>({
    countryCode: "US",
    metal: "silver",
    purity: 90
  });

  // Purchase dialog state
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [selectedSKU, setSelectedSKU] = useState<string>("");
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
  const [selectedCoinForSale, setSelectedCoinForSale] = useState<string>("");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [availableCoinsForSale, setAvailableCoinsForSale] = useState<Coin[]>([]);
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

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/");
        return;
      }
      
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCoins();
      loadSpotPrices();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let filtered = coins;
    
    if (searchTerm) {
      filtered = filtered.filter(coin => 
        coin.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.coinName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.countryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.kmNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        COUNTRY_CODES[coin.countryCode]?.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Search reference coins with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (referenceSearchTerm.trim().length >= 2) {
        setIsSearching(true);
        const { data, error } = await coinReferenceService.searchReferences(referenceSearchTerm);
        
        if (!error && data) {
          setReferenceSearchResults(data);
        }
        setIsSearching(false);
      } else {
        setReferenceSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [referenceSearchTerm]);

  const loadCoins = async () => {
    const { data, error } = await userCoinService.getUserCoins();
    
    if (error) {
      console.error("Error loading coins:", error);
      return;
    }

    if (data) {
      // Map database coins to frontend Coin type
      const mappedCoins: Coin[] = data.map(c => ({
        id: c.id,
        sku: `${c.country_code}-${c.km_number}`,
        coinName: c.coin_name || "",
        countryCode: c.country_code,
        kmNumber: c.km_number,
        year: c.year,
        mintmark: c.mintmark || "",
        metal: c.metal as "gold" | "silver" | "copper" | "platinum" | "palladium" | "other",
        purity: c.purity,
        weight: c.weight,
        sheldonGrade: c.grade as SheldonGrade,
        purchasePrice: c.purchase_price,
        purchaseDate: c.purchase_date,
        notes: c.notes || "",
        obverseImageUrl: c.obverse_image_url || "",
        reverseImageUrl: c.reverse_image_url || "",
        isSold: c.is_sold
      }));
      
      setCoins(mappedCoins);
      setFilteredCoins(mappedCoins);
    }
  };

  const loadSpotPrices = async () => {
    const prices = await spotPriceService.getSpotPrices();
    setSpotPrices(prices);
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
  const handleSelectReference = (reference: any) => {
    setFormData({
      countryCode: reference.country_code,
      kmNumber: reference.km_number,
      coinName: reference.coin_name,
      metal: reference.metal,
      purity: reference.purity,
      weight: reference.weight,
      obverseImageUrl: reference.obverse_image_url || "",
      reverseImageUrl: reference.reverse_image_url || ""
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
          coin_name: formData.coinName!,
          country_code: formData.countryCode,
          km_number: formData.kmNumber!,
          metal: formData.metal!,
          purity: formData.purity!,
          weight: formData.weight!,
          obverse_image_url: obverseImageUrl || null,
          reverse_image_url: reverseImageUrl || null
        });

        if (refError) {
          alert("Failed to create reference coin. Please try again.");
          console.error("Reference creation error:", refError);
          return;
        }
      }

      alert(`Reference coin ${sku} created successfully! Now use "Add Purchase" to add individual coins.`);
      await loadCoins();
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error saving reference coin:", error);
      alert("Failed to save reference coin. Please try again.");
    }
  };

  const handleAddCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.countryCode || !formData.kmNumber || !formData.metal || 
        !formData.purity || !formData.weight || !formData.coinName) {
      alert("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
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
          coin_name: formData.coinName!,
          country_code: formData.countryCode,
          km_number: formData.kmNumber!,
          metal: formData.metal!,
          purity: formData.purity!,
          weight: formData.weight!,
          obverse_image_url: obverseImageUrl || null,
          reverse_image_url: reverseImageUrl || null
        });

        if (refError) {
          alert("Failed to create reference coin. Please try again.");
          console.error("Reference creation error:", refError);
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare purchase form data with the created reference coin info
      const newPurchaseFormData = {
        sku,
        coinName: formData.coinName!,
        countryCode: formData.countryCode,
        kmNumber: formData.kmNumber!,
        metal: formData.metal!,
        purity: formData.purity!,
        weight: formData.weight!,
        obverseImageUrl: obverseImageUrl,
        reverseImageUrl: reverseImageUrl,
        year: new Date().getFullYear(),
        mintmark: "",
        sheldonGrade: "MS-63" as SheldonGrade,
        purchaseDate: new Date().toISOString().split("T")[0],
        purchasePrice: 0,
        notes: ""
      };

      // Close Add SKU dialog first
      setIsAddDialogOpen(false);
      resetForm();

      // Small delay to ensure the dialog transition completes
      setTimeout(() => {
        setPurchaseFormData(newPurchaseFormData);
        setIsAddPurchaseOpen(true);
      }, 100);

      await loadCoins();
    } catch (error) {
      console.error("Error saving reference coin:", error);
      alert("Failed to add coin. Please try again.");
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
    setEditingCoin(null);
    setObverseImageFile(null);
    setReverseImageFile(null);
    setObverseImagePreview("");
    setReverseImagePreview("");
    setReferenceSearchTerm("");
    setReferenceSearchResults([]);
  };

  const calculateBullionValue = (coin: Coin): number => {
    if (!spotPrices) return 0;
    return spotPriceService.calculateBullionValue(
      coin.metal,
      coin.weight,
      coin.purity,
      spotPrices
    );
  };

  // Handle Add Purchase
  const handleOpenAddPurchase = (sku: string) => {
    const skuCoins = coins.filter(c => c.sku === sku);
    if (skuCoins.length === 0) return;

    const referenceCoin = skuCoins[0];
    setSelectedSKU(sku);
    setPurchaseFormData({
      sku: referenceCoin.sku,
      coinName: referenceCoin.coinName,
      countryCode: referenceCoin.countryCode,
      kmNumber: referenceCoin.kmNumber,
      metal: referenceCoin.metal,
      purity: referenceCoin.purity,
      weight: referenceCoin.weight,
      obverseImageUrl: referenceCoin.obverseImageUrl || "",
      reverseImageUrl: referenceCoin.reverseImageUrl || "",
      year: referenceCoin.year,
      mintmark: referenceCoin.mintmark || "",
      sheldonGrade: referenceCoin.sheldonGrade,
      purchaseDate: new Date().toISOString().split("T")[0],
      purchasePrice: referenceCoin.purchasePrice,
      notes: ""
    });
    setIsAddPurchaseOpen(true);
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!purchaseFormData.year || !purchaseFormData.purchasePrice || !purchaseFormData.purchaseDate) {
      alert("Please fill in all required fields");
      return;
    }

    const newCoinData = {
      sku: purchaseFormData.sku,
      coin_name: purchaseFormData.coinName,
      country_code: purchaseFormData.countryCode,
      km_number: purchaseFormData.kmNumber,
      metal: purchaseFormData.metal,
      purity: purchaseFormData.purity,
      weight: purchaseFormData.weight,
      year: purchaseFormData.year,
      mintmark: purchaseFormData.mintmark,
      grade: purchaseFormData.sheldonGrade,
      purchase_date: purchaseFormData.purchaseDate,
      purchase_price: purchaseFormData.purchasePrice,
      notes: purchaseFormData.notes,
      obverse_image_url: purchaseFormData.obverseImageUrl,
      reverse_image_url: purchaseFormData.reverseImageUrl,
      is_sold: false
    };

    const result = await userCoinService.addUserCoin(newCoinData);
    
    if (result.error) {
      console.error("Error adding purchase:", result.error);
      alert("Failed to add purchase. Please try again.");
      return;
    }

    loadCoins();
    setIsAddPurchaseOpen(false);
    setPurchaseFormData({
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
  };

  // Handle Record Sale
  const handleOpenRecordSale = (sku: string) => {
    const skuCoins = coins.filter(c => c.sku === sku && !c.isSold);
    if (skuCoins.length === 0) {
      alert("No available coins to sell for this SKU");
      return;
    }

    setSelectedSKU(sku);
    setAvailableCoinsForSale(skuCoins);
    
    if (skuCoins.length === 1) {
      const coin = skuCoins[0];
      setSaleFormData({
        coinId: coin.id,
        saleDate: new Date().toISOString().split("T")[0],
        salePrice: calculateBullionValue(coin),
        buyerInfo: "",
        notes: ""
      });
      setSelectedCoinForSale(coin.id);
    } else {
      setSaleFormData({
        coinId: "",
        saleDate: new Date().toISOString().split("T")[0],
        salePrice: 0,
        buyerInfo: "",
        notes: ""
      });
      setSelectedCoinForSale("");
    }
    
    setIsSaleDialogOpen(true);
  };

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

  const handleImageClick = (imageUrl: string, coinName: string) => {
    setSelectedImage({ url: imageUrl, alt: coinName });
    setImageViewerOpen(true);
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

  // Don't render collection content if not authenticated
  if (!isAuthenticated) {
    return null;
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

          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-white text-slate-900 hover:bg-slate-100">
                  <Plus className="w-4 h-4 mr-2" />
                  Add SKU
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-white">
                    Add New Coin Reference (SKU)
                  </DialogTitle>
                  <p className="text-slate-400 text-sm">
                    Define the coin type specifications. Individual coins are added via "Add Purchase" button.
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
                    {isSearching && (
                      <p className="text-slate-400 text-sm mt-2">Searching...</p>
                    )}
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
                            <img 
                              src={obverseImagePreview || formData.obverseImageUrl} 
                              alt="Obverse Preview" 
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
                            <img 
                              src={reverseImagePreview || formData.reverseImageUrl} 
                              alt="Reverse Preview" 
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
                    {countryCoins.map(({ sku, coins: skuCoins }) => {
                      const coin = skuCoins[0];
                      const unsoldCoins = skuCoins.filter(c => !c.isSold);
                      const totalBullionValue = unsoldCoins.reduce((sum, c) => sum + calculateBullionValue(c), 0);
                      const totalCost = unsoldCoins.reduce((sum, c) => sum + c.purchasePrice, 0);

                      return (
                        <Card 
                          key={sku} 
                          className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors overflow-hidden group"
                        >
                          <div 
                            className="aspect-square relative bg-slate-900/50 overflow-hidden cursor-pointer grid grid-cols-2 gap-1 p-1"
                            onClick={() => router.push(`/coin/${encodeURIComponent(sku)}`)}
                          >
                            {coin.obverseImageUrl || coin.reverseImageUrl ? (
                              <>
                                {coin.obverseImageUrl ? (
                                  <img 
                                    src={coin.obverseImageUrl} 
                                    alt={`${coin.coinName || sku} - Obverse`}
                                    className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded">
                                    <Package className="w-8 h-8 text-slate-700" />
                                  </div>
                                )}
                                {coin.reverseImageUrl ? (
                                  <img 
                                    src={coin.reverseImageUrl} 
                                    alt={`${coin.coinName || sku} - Reverse`}
                                    className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-800/50 rounded">
                                    <Package className="w-8 h-8 text-slate-700" />
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="col-span-2 w-full h-full flex items-center justify-center">
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
                              <p className="text-slate-400 text-sm font-mono">
                                {sku}
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

                            <div className="flex gap-2 pt-3 border-t border-slate-700">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAddPurchase(sku);
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Purchase
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRecordSale(sku);
                                }}
                                disabled={unsoldCoins.length === 0}
                              >
                                <DollarSign className="w-3 h-3 mr-1" />
                                Sale
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
              Record Sale - {selectedSKU}
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
                    {spotPriceService.formatCHF(availableCoinsForSale.find(c => c.id === selectedCoinForSale)!.purchasePrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sale Price:</span>
                  <span className="text-white font-medium">{spotPriceService.formatCHF(saleFormData.salePrice)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                  <span className="text-slate-400">Profit:</span>
                  <span className={`font-bold ${saleFormData.salePrice - availableCoinsForSale.find(c => c.id === selectedCoinForSale)!.purchasePrice >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {spotPriceService.formatCHF(saleFormData.salePrice - availableCoinsForSale.find(c => c.id === selectedCoinForSale)!.purchasePrice)}
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

      <ImageViewer
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageUrl={selectedImage?.url || ""}
        alt={selectedImage?.alt || ""}
      />
    </Layout>
  );
}