import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { userCoinService } from "@/services/userCoinService";
import { userSalesService } from "@/services/userSalesService";
import { spotPriceService, SpotPrices } from "@/lib/spotPrices";
import { imageService } from "@/services/imageService";
import { ImageViewer } from "@/components/ImageViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createListing } from "@/services/listingService";
import type { Coin, SheldonGrade } from "@/types/coin";
import { COUNTRY_CODES, SHELDON_GRADES } from "@/types/coin";
import { StatisticsPanel } from "@/components/coin/StatisticsPanel";
import { FilterBar, type FilterState } from "@/components/coin/FilterBar";
import { GroupedCoinTable } from "@/components/coin/GroupedCoinTable";

export default function CoinDetail() {
  const router = useRouter();
  const { sku } = router.query;
  const [coins, setCoins] = useState<Coin[]>([]);
  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);
  
  // New state for filters and sorting
  const [filters, setFilters] = useState<FilterState>({
    grades: [],
    status: "all",
    dateRange: "all"
  });
  const [sortBy, setSortBy] = useState<"year-asc" | "year-desc" | "date-newest" | "date-oldest" | "price-low" | "price-high" | "grade" | "best-to-sell" | "profit">("year-desc");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isEditCoinDialogOpen, setIsEditCoinDialogOpen] = useState(false);
  const [editingCoin, setEditingCoin] = useState<Coin | null>(null);
  const [editingIndividualCoin, setEditingIndividualCoin] = useState<Coin | null>(null);
  const [purchaseFormData, setPurchaseFormData] = useState<{
    year: number;
    mintmark: string;
    sheldonGrade: SheldonGrade;
    purchaseDate: string;
    purchasePrice: number;
    notes: string;
  }>({
    year: new Date().getFullYear(),
    mintmark: "",
    sheldonGrade: "MS-63" as SheldonGrade,
    purchaseDate: new Date().toISOString().split("T")[0],
    purchasePrice: 0,
    notes: ""
  });
  const [saleFormData, setSaleFormData] = useState<{
    coinId: string;
    saleDate: string;
    salePrice: number;
    buyerInfo?: string;
    notes?: string;
  }>({ coinId: "", saleDate: new Date().toISOString().split("T")[0], salePrice: 0 });
  
  // Image upload state
  const [obverseImageFile, setObverseImageFile] = useState<File | null>(null);
  const [reverseImageFile, setReverseImageFile] = useState<File | null>(null);
  const [obverseImagePreview, setObverseImagePreview] = useState<string>("");
  const [reverseImagePreview, setReverseImagePreview] = useState<string>("");
  
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  const [salesData, setSalesData] = useState<Array<{
    coin_id: string;
    sale_price: number;
    sale_date: string;
    buyer_info?: string;
    notes?: string;
  }>>();

  const loadSalesData = async () => {
    const { data } = await userSalesService.getUserSales();
    if (data) setSalesData(data);
  };

  useEffect(() => {
    loadSalesData();
  }, [coins]);

  useEffect(() => {
    if (sku) {
      loadCoins();
      loadSpotPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku]);

  const loadCoins = async () => {
    if (!sku) return;
    
    const { data } = await userCoinService.getCoinsBySku(sku as string);
    if (data) {
      const mappedCoins: Coin[] = data.map((c) => ({
        id: c.id,
        referenceCoinId: c.reference_coin_id,
        sku: c.sku,
        coinName: c.coin_name,
        countryCode: c.country_code,
        kmNumber: c.coins_reference?.km_number || "",
        year: c.year,
        mintmark: c.mintmark,
        metal: (c.coins_reference?.metal || "other") as "gold" | "silver" | "copper" | "platinum" | "palladium" | "other",
        purity: c.coins_reference?.purity || 0,
        weight: c.coins_reference?.weight || 0,
        sheldonGrade: c.grade as SheldonGrade,
        purchasePrice: c.purchase_price,
        purchaseDate: c.purchase_date,
        notes: c.notes,
        obverseImageUrl: c.obverse_image_url,
        reverseImageUrl: c.reverse_image_url,
        isSold: c.is_sold,
        listingId: c.listing_id
      }));
      setCoins(mappedCoins);
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

  const handleEditClick = () => {
    const referenceCoin = coins[0];
    setEditingCoin(referenceCoin);
    setObverseImagePreview(referenceCoin.obverseImageUrl || "");
    setReverseImagePreview(referenceCoin.reverseImageUrl || "");
    setObverseImageFile(null);
    setReverseImageFile(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCoin || !editingCoin.coinName || !editingCoin.kmNumber) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      let obverseImageUrl = editingCoin.obverseImageUrl || "";
      let reverseImageUrl = editingCoin.reverseImageUrl || "";
      
      // Upload obverse image if changed
      if (obverseImageFile) {
        const result = await imageService.uploadImage(obverseImageFile);
        obverseImageUrl = result.url;
      }

      // Upload reverse image if changed
      if (reverseImageFile) {
        const result = await imageService.uploadImage(reverseImageFile);
        reverseImageUrl = result.url;
      }

      const newSKU = `${editingCoin.countryCode}-${editingCoin.kmNumber}`;
      
      // Update all coins with this SKU
      for (const coin of coins) {
        await userCoinService.updateUserCoin(coin.id, {
          coin_name: editingCoin.coinName,
          country_code: editingCoin.countryCode,
          
          sku: newSKU,
          obverse_image_url: obverseImageUrl,
          reverse_image_url: reverseImageUrl,
        });
      }

      setIsEditDialogOpen(false);
      setEditingCoin(null);
      setObverseImageFile(null);
      setReverseImageFile(null);
      
      // Navigate to new SKU page if SKU changed
      if (newSKU !== sku) {
        router.push(`/coin/${encodeURIComponent(newSKU)}`);
      } else {
        loadCoins();
      }
    } catch (error) {
      console.error("Error updating coin:", error);
      alert("Failed to update coin. Please try again.");
    }
  };

  const handleEditIndividualCoin = (coin: Coin) => {
    setEditingIndividualCoin(coin);
    setIsEditCoinDialogOpen(true);
  };

  const handleEditIndividualCoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingIndividualCoin) {
      alert("No coin selected for editing");
      return;
    }

    try {
      await userCoinService.updateUserCoin(editingIndividualCoin.id, {
        year: editingIndividualCoin.year,
        mintmark: editingIndividualCoin.mintmark,
        grade: editingIndividualCoin.sheldonGrade,
        purchase_date: editingIndividualCoin.purchaseDate,
        purchase_price: editingIndividualCoin.purchasePrice,
        notes: editingIndividualCoin.notes,
      });

      setIsEditCoinDialogOpen(false);
      setEditingIndividualCoin(null);
      loadCoins();
    } catch (error) {
      console.error("Error updating individual coin:", error);
      alert("Failed to update coin. Please try again.");
    }
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!purchaseFormData.year || !purchaseFormData.purchasePrice || !purchaseFormData.purchaseDate) {
      alert("Please fill in all required fields");
      return;
    }

    const referenceCoin = coins[0];
    const newCoin = {
      sku: referenceCoin.sku,
      coin_name: referenceCoin.coinName,
      country_code: referenceCoin.countryCode,
      reference_coin_id: referenceCoin.referenceCoinId!,
      year: purchaseFormData.year,
      mintmark: purchaseFormData.mintmark,
      grade: purchaseFormData.sheldonGrade,
      purchase_date: purchaseFormData.purchaseDate,
      purchase_price: purchaseFormData.purchasePrice,
      notes: purchaseFormData.notes,
      obverse_image_url: referenceCoin.obverseImageUrl || "",
      reverse_image_url: referenceCoin.reverseImageUrl || "",
      is_sold: false
    };

    await userCoinService.addUserCoin(newCoin);
    loadCoins();
    setIsAddPurchaseOpen(false);
    setPurchaseFormData({
      year: referenceCoin.year,
      mintmark: "",
      sheldonGrade: "MS-63" as SheldonGrade,
      purchaseDate: new Date().toISOString().split("T")[0],
      purchasePrice: 0,
      notes: ""
    });
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

  const handleRecordSale = (coinId: string) => {
    const coin = coins.find(c => c.id === coinId);
    if (!coin) return;
    
    setSaleFormData({
      coinId,
      saleDate: new Date().toISOString().split("T")[0],
      salePrice: calculateBullionValue(coin)
    });
    setIsSaleDialogOpen(true);
  };

  // Helper for sorting options
  const sortOptions = [
    { value: "year-desc", label: "Year (Newest)" },
    { value: "year-asc", label: "Year (Oldest)" },
    { value: "date-newest", label: "Purchase Date (Newest)" },
    { value: "date-oldest", label: "Purchase Date (Oldest)" },
    { value: "price-high", label: "Price (Highest)" },
    { value: "price-low", label: "Price (Lowest)" },
    { value: "grade", label: "Grade (High to Low)" },
    { value: "best-to-sell", label: "Best to Sell" },
    { value: "profit", label: "Profit Potential" },
  ] as const;

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!saleFormData.coinId || !saleFormData.saleDate || !saleFormData.salePrice) {
      alert("Please fill in all required fields");
      return;
    }

    const sale = {
      coin_id: saleFormData.coinId,
      sale_date: saleFormData.saleDate,
      sale_price: saleFormData.salePrice,
      buyer_info: saleFormData.buyerInfo || "",
      notes: saleFormData.notes || "",
      purchase_price: 0,
      markup_percentage: 0,
      profit: 0
    };

    await userSalesService.addSale(sale);
    await userCoinService.updateUserCoin(saleFormData.coinId, { is_sold: true });
    
    loadCoins();
    setIsSaleDialogOpen(false);
    setSaleFormData({ coinId: "", saleDate: new Date().toISOString().split("T")[0], salePrice: 0 });
  };

  const handleDeleteCoin = async (coinId: string) => {
    if (confirm("Are you sure you want to delete this coin?")) {
      await userCoinService.deleteUserCoin(coinId);
      loadCoins();
      
      // If no coins left with this SKU, redirect back to collection
      const { data: remainingCoins } = await userCoinService.getCoinsBySku(sku as string);
      if (!remainingCoins || remainingCoins.length === 0) {
        router.push("/collection");
      }
    }
  };

  // Create listing dialog state
  const [isCreateListingDialogOpen, setIsCreateListingDialogOpen] = useState(false);
  const [listingCoin, setListingCoin] = useState<Coin | null>(null);
  const [listingFormData, setListingFormData] = useState({
    platform: "",
    startingPrice: "",
    currentBid: "",
    expectedEndDate: "",
    notes: ""
  });

  function openCreateListingDialog(coin: Coin) {
    setListingCoin(coin);
    setListingFormData({
      platform: "",
      startingPrice: coin.purchasePrice.toString(),
      currentBid: "",
      expectedEndDate: "",
      notes: ""
    });
    setIsCreateListingDialogOpen(true);
  }

  async function handleCreateListing() {
    if (!listingCoin) return;

    const data = {
      coinId: listingCoin.id,
      platform: listingFormData.platform,
      startingPrice: parseFloat(listingFormData.startingPrice),
      currentBid: listingFormData.currentBid ? parseFloat(listingFormData.currentBid) : undefined,
      expectedEndDate: listingFormData.expectedEndDate || undefined,
      notes: listingFormData.notes || undefined
    };

    const { error: listingError } = await createListing(data);
    if (listingError) {
      alert(`Error creating listing: ${listingError.message}`);
    } else {
      setIsCreateListingDialogOpen(false);
      loadCoins(); // Reload to show updated status
    }
  }

  if (!sku || coins.length === 0) {
    return (
      <Layout>
        <SEO title="Coin Not Found - NumiVault" />
        <div className="text-center py-16">
          <p className="text-slate-400 text-lg mb-4">Coin not found</p>
          <Link href="/collection">
            <Button variant="outline" className="border-slate-600 text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Collection
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const referenceCoin = coins[0];
  const totalCost = coins.filter(c => !c.isSold).reduce((sum, c) => sum + c.purchasePrice, 0);
  const totalSpotValue = coins.filter(c => !c.isSold).reduce((sum, c) => sum + calculateBullionValue(c), 0);
  const soldCoins = coins.filter(c => c.isSold);
  const soldCount = soldCoins.length;
  const totalSoldAmount = soldCoins.reduce((sum, c) => {
    const sale = salesData?.find(s => s.coin_id === c.id);
    return sum + (sale?.sale_price || 0);
  }, 0);
  const soldCost = soldCoins.reduce((sum, c) => sum + c.purchasePrice, 0);
  const totalProfit = totalSoldAmount - soldCost;

  const metalContent = (referenceCoin.weight * referenceCoin.purity / 100).toFixed(3);

  return (
    <Layout>
      <SEO 
        title={`${referenceCoin.coinName} - NumiVault`}
        description={`Manage ${referenceCoin.sku} coins in your collection`}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link href="/collection">
              <Button variant="ghost" className="text-slate-400 hover:text-white mb-2 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Collection
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {referenceCoin.coinName}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg font-mono">
              {referenceCoin.sku}
            </p>
          </div>

          <Button 
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
            onClick={handleEditClick}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Images and Specs */}
          <div className="space-y-6">
            {/* Coin Images */}
            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start gap-6">
                  {referenceCoin.obverseImageUrl && (
                    <div className="space-y-2">
                      <span className="text-sm text-slate-400">Obverse</span>
                      <Image
                        src={referenceCoin.obverseImageUrl}
                        alt={`${referenceCoin.coinName} - Obverse`}
                        width={192}
                        height={192}
                        className="w-48 h-48 object-cover rounded-lg border-2 border-amber-500/20 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setSelectedImage({ url: referenceCoin.obverseImageUrl ?? "", alt: `${referenceCoin.coinName} - Obverse` });
                          setImageViewerOpen(true);
                        }}
                        loading="lazy"
                      />
                    </div>
                  )}
                  {referenceCoin.reverseImageUrl && (
                    <div className="space-y-2">
                      <span className="text-sm text-slate-400">Reverse</span>
                      <Image
                        src={referenceCoin.reverseImageUrl}
                        alt={`${referenceCoin.coinName} - Reverse`}
                        width={192}
                        height={192}
                        className="w-48 h-48 object-cover rounded-lg border-2 border-amber-500/20 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setSelectedImage({ url: referenceCoin.reverseImageUrl ?? "", alt: `${referenceCoin.coinName} - Reverse` });
                          setImageViewerOpen(true);
                        }}
                        loading="lazy"
                      />
                    </div>
                  )}
                  {!referenceCoin.obverseImageUrl && !referenceCoin.reverseImageUrl && (
                    <div className="w-48 h-48 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-700 border-dashed">
                      <span className="text-slate-500">No images</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Badge className="bg-slate-800 text-slate-200 border-0 capitalize">
                    {referenceCoin.metal}
                  </Badge>
                  <Badge className="bg-slate-800 text-slate-200 border-0">
                    {COUNTRY_CODES[referenceCoin.countryCode]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-6 text-white">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Purity</p>
                    <p className="text-2xl font-semibold">{referenceCoin.purity}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Weight</p>
                    <p className="text-2xl font-semibold">{referenceCoin.weight}g</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-sm mb-1">Metal Content</p>
                    <p className="text-2xl font-semibold">{metalContent}g</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats and Actions */}
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">In Collection</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white">{coins.length - soldCount}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Total Cost</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white">{spotPriceService.formatCHF(totalCost)}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Spot Value</p>
                  <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{spotPriceService.formatCHF(totalSpotValue)}</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Total Sold</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-white">{soldCount}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    {spotPriceService.formatCHF(totalProfit)} profit
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-14 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setIsAddPurchaseOpen(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Purchase
              </Button>

              <Button 
                className="h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                disabled={coins.filter(c => !c.isSold).length === 0}
                onClick={() => {
                  const unsoldCoins = coins.filter(c => !c.isSold);
                  if (unsoldCoins.length > 0) {
                    handleRecordSale(unsoldCoins[0].id);
                  }
                }}
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Record Sale ({coins.filter(c => !c.isSold).length})
              </Button>
            </div>
          </div>
        </div>
        
        {/* Statistics Panel */}
        <StatisticsPanel coins={coins} />

        {/* Individual Coins Table */}
        <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl text-slate-900 dark:text-white">Individual Coins</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="sort-by" className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Sort by:</Label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger id="sort-by" className="w-[180px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Filter Bar */}
            <FilterBar 
              filters={filters} 
              onFiltersChange={setFilters} 
              onReset={() => setFilters({ grades: [], status: "all", dateRange: "all" })} 
            />
          </CardHeader>
          <CardContent>
            <GroupedCoinTable 
              coins={coins}
              filters={filters}
              salesData={salesData || []}
              sortBy={sortBy}
              onEditCoin={handleEditIndividualCoin}
              onDeleteCoin={handleDeleteCoin}
              onRecordSale={handleRecordSale}
              onCreateListing={openCreateListingDialog}
              onViewListing={() => router.push('/listings')}
              calculateBullionValue={calculateBullionValue}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit SKU Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-900 dark:text-white">Edit SKU Information</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="coinName" className="text-slate-700 dark:text-slate-300">Coin Name *</Label>
                <Input
                  id="coinName"
                  value={editingCoin?.coinName || ""}
                  onChange={(e) => setEditingCoin(editingCoin ? {...editingCoin, coinName: e.target.value} : null)}
                  placeholder="e.g., 5 Francs - Léopold II petit..."
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="countryCode" className="text-slate-700 dark:text-slate-300">Country Code *</Label>
                <Select 
                  value={editingCoin?.countryCode} 
                  onValueChange={(value) => setEditingCoin(editingCoin ? {...editingCoin, countryCode: value} : null)}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 max-h-60">
                    {Object.entries(COUNTRY_CODES).map(([code, name]) => (
                      <SelectItem key={code} value={code} className="text-slate-900 dark:text-white">
                        {code} - {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="kmNumber" className="text-slate-700 dark:text-slate-300">KM Number *</Label>
                <Input
                  id="kmNumber"
                  value={editingCoin?.kmNumber || ""}
                  onChange={(e) => setEditingCoin(editingCoin ? {...editingCoin, kmNumber: e.target.value} : null)}
                  placeholder="e.g., 24 or 35.2"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="metal" className="text-slate-700 dark:text-slate-300">Metal *</Label>
                <Select 
                  value={editingCoin?.metal} 
                  onValueChange={(value) => setEditingCoin(editingCoin ? {...editingCoin, metal: value as "gold" | "silver" | "copper" | "platinum" | "palladium" | "other"} : null)}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                    <SelectItem value="gold" className="text-slate-900 dark:text-white">Gold</SelectItem>
                    <SelectItem value="silver" className="text-slate-900 dark:text-white">Silver</SelectItem>
                    <SelectItem value="copper" className="text-slate-900 dark:text-white">Copper</SelectItem>
                    <SelectItem value="platinum" className="text-slate-900 dark:text-white">Platinum</SelectItem>
                    <SelectItem value="palladium" className="text-slate-900 dark:text-white">Palladium</SelectItem>
                    <SelectItem value="other" className="text-slate-900 dark:text-white">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purity" className="text-slate-700 dark:text-slate-300">Purity (%) *</Label>
                <Input
                  id="purity"
                  type="number"
                  step="0.01"
                  value={editingCoin?.purity || ""}
                  onChange={(e) => setEditingCoin(editingCoin ? {...editingCoin, purity: parseFloat(e.target.value)} : null)}
                  placeholder="e.g., 90"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="weight" className="text-slate-700 dark:text-slate-300">Weight (grams) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={editingCoin?.weight || ""}
                  onChange={(e) => setEditingCoin(editingCoin ? {...editingCoin, weight: parseFloat(e.target.value)} : null)}
                  placeholder="e.g., 25.0"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editObverseImage" className="text-slate-700 dark:text-slate-300">Obverse Image (Front)</Label>
                <div className="space-y-2 mt-1">
                  <Input
                    id="editObverseImage"
                    type="file"
                    accept="image/*"
                    onChange={handleObverseImageChange}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  {(obverseImagePreview || editingCoin?.obverseImageUrl) && (
                    <div className="mt-2">
                      <Image 
                        src={obverseImagePreview || editingCoin?.obverseImageUrl || ""} 
                        alt="Obverse Preview" 
                        width={128}
                        height={128}
                        className="w-32 h-32 object-cover rounded-lg border-2 border-slate-700"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="editReverseImage" className="text-slate-700 dark:text-slate-300">Reverse Image (Back)</Label>
                <div className="space-y-2 mt-1">
                  <Input
                    id="editReverseImage"
                    type="file"
                    accept="image/*"
                    onChange={handleReverseImageChange}
                    className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  {(reverseImagePreview || editingCoin?.reverseImageUrl) && (
                    <div className="mt-2">
                      <Image 
                        src={reverseImagePreview || editingCoin?.reverseImageUrl || ""} 
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

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingCoin(null);
                }}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Individual Coin Dialog */}
      <Dialog open={isEditCoinDialogOpen} onOpenChange={setIsEditCoinDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-900 dark:text-white">Edit Individual Coin</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleEditIndividualCoinSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editYear" className="text-slate-700 dark:text-slate-300">Year *</Label>
                <Input
                  id="editYear"
                  type="number"
                  value={editingIndividualCoin?.year || ""}
                  onChange={(e) => setEditingIndividualCoin(editingIndividualCoin ? {...editingIndividualCoin, year: parseInt(e.target.value)} : null)}
                  placeholder="e.g., 1879"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="editMintmark" className="text-slate-700 dark:text-slate-300">Mintmark</Label>
                <Input
                  id="editMintmark"
                  value={editingIndividualCoin?.mintmark || ""}
                  onChange={(e) => setEditingIndividualCoin(editingIndividualCoin ? {...editingIndividualCoin, mintmark: e.target.value} : null)}
                  placeholder="e.g., D, S (optional)"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="editGrade" className="text-slate-700 dark:text-slate-300">Sheldon Grade *</Label>
                <Select 
                  value={editingIndividualCoin?.sheldonGrade} 
                  onValueChange={(value) => setEditingIndividualCoin(editingIndividualCoin ? {...editingIndividualCoin, sheldonGrade: value as SheldonGrade} : null)}
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
                <Label htmlFor="editPurchaseDate" className="text-slate-700 dark:text-slate-300">Purchase Date *</Label>
                <Input
                  id="editPurchaseDate"
                  type="date"
                  value={editingIndividualCoin?.purchaseDate || ""}
                  onChange={(e) => setEditingIndividualCoin(editingIndividualCoin ? {...editingIndividualCoin, purchaseDate: e.target.value} : null)}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="editPurchasePrice" className="text-slate-700 dark:text-slate-300">Purchase Price (CHF) *</Label>
                <Input
                  id="editPurchasePrice"
                  type="number"
                  step="0.01"
                  value={editingIndividualCoin?.purchasePrice || ""}
                  onChange={(e) => setEditingIndividualCoin(editingIndividualCoin ? {...editingIndividualCoin, purchasePrice: parseFloat(e.target.value)} : null)}
                  placeholder="e.g., 19.06"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="editNotes" className="text-slate-700 dark:text-slate-300">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={editingIndividualCoin?.notes || ""}
                  onChange={(e) => setEditingIndividualCoin(editingIndividualCoin ? {...editingIndividualCoin, notes: e.target.value} : null)}
                  placeholder="Additional notes about this coin"
                  rows={3}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditCoinDialogOpen(false);
                  setEditingIndividualCoin(null);
                }}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Purchase Dialog */}
      <Dialog open={isAddPurchaseOpen} onOpenChange={setIsAddPurchaseOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-900 dark:text-white">Add Individual Coin Purchase</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddPurchase} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year" className="text-slate-700 dark:text-slate-300">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={purchaseFormData.year}
                  onChange={(e) => setPurchaseFormData({...purchaseFormData, year: parseInt(e.target.value)})}
                  placeholder="e.g., 1879"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="mintmark" className="text-slate-700 dark:text-slate-300">Mintmark</Label>
                <Input
                  id="mintmark"
                  value={purchaseFormData.mintmark}
                  onChange={(e) => setPurchaseFormData({...purchaseFormData, mintmark: e.target.value})}
                  placeholder="e.g., D, S (optional)"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <Label htmlFor="sheldonGrade" className="text-slate-700 dark:text-slate-300">Sheldon Grade *</Label>
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
                <Label htmlFor="purchaseDate" className="text-slate-700 dark:text-slate-300">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseFormData.purchaseDate}
                  onChange={(e) => setPurchaseFormData({...purchaseFormData, purchaseDate: e.target.value})}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="purchasePrice" className="text-slate-700 dark:text-slate-300">Purchase Price (CHF) *</Label>
                <Input
                  id="purchasePrice"
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
                <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={purchaseFormData.notes}
                  onChange={(e) => setPurchaseFormData({...purchaseFormData, notes: e.target.value})}
                  placeholder="Additional notes about this coin"
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
                Add Purchase
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sale Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-900 dark:text-white">Record Sale</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSaleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="saleDate" className="text-slate-700 dark:text-slate-300">Sale Date *</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleFormData.saleDate}
                onChange={(e) => setSaleFormData({...saleFormData, saleDate: e.target.value})}
                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="salePrice" className="text-slate-700 dark:text-slate-300">Sale Price (CHF) *</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                value={saleFormData.salePrice || ""}
                onChange={(e) => setSaleFormData({...saleFormData, salePrice: parseFloat(e.target.value)})}
                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="buyerInfo" className="text-slate-700 dark:text-slate-300">Buyer Information</Label>
              <Input
                id="buyerInfo"
                value={saleFormData.buyerInfo || ""}
                onChange={(e) => setSaleFormData({...saleFormData, buyerInfo: e.target.value})}
                placeholder="Optional buyer details"
                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300">Notes</Label>
              <Textarea
                id="notes"
                value={saleFormData.notes || ""}
                onChange={(e) => setSaleFormData({...saleFormData, notes: e.target.value})}
                placeholder="Additional sale information"
                rows={3}
                className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSaleDialogOpen(false)} className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                Record Sale
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Listing Dialog */}
      <Dialog open={isCreateListingDialogOpen} onOpenChange={setIsCreateListingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>List Coin for Sale</DialogTitle>
            <DialogDescription>
              {listingCoin && `${listingCoin.coinName} (${listingCoin.sku})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform/Venue *</Label>
              <Input
                id="platform"
                value={listingFormData.platform}
                onChange={(e) => setListingFormData({ ...listingFormData, platform: e.target.value })}
                placeholder="e.g., eBay, Heritage Auctions"
                required
              />
            </div>
            <div>
              <Label htmlFor="starting-price">Starting Price (CHF) *</Label>
              <Input
                id="starting-price"
                type="number"
                step="0.01"
                value={listingFormData.startingPrice}
                onChange={(e) => setListingFormData({ ...listingFormData, startingPrice: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="current-bid">Current Bid (CHF)</Label>
              <Input
                id="current-bid"
                type="number"
                step="0.01"
                value={listingFormData.currentBid}
                onChange={(e) => setListingFormData({ ...listingFormData, currentBid: e.target.value })}
                placeholder="Optional - update as bids come in"
              />
            </div>
            <div>
              <Label htmlFor="end-date">Expected End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={listingFormData.expectedEndDate}
                onChange={(e) => setListingFormData({ ...listingFormData, expectedEndDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="listing-notes">Notes</Label>
              <Textarea
                id="listing-notes"
                value={listingFormData.notes}
                onChange={(e) => setListingFormData({ ...listingFormData, notes: e.target.value })}
                placeholder="Additional information about this listing"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateListingDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateListing}
              disabled={!listingFormData.platform || !listingFormData.startingPrice}
            >
              Create Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      {selectedImage && (
        <ImageViewer
          isOpen={imageViewerOpen}
          onClose={() => setImageViewerOpen(false)}
          imageUrl={selectedImage.url}
          alt={selectedImage.alt}
        />
      )}
    </Layout>
  );
}