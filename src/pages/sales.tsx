import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { spotPriceService } from "@/lib/spotPrices";
import { userCoinService } from "@/services/userCoinService";
import { userSalesService } from "@/services/userSalesService";
import { Coin, Sale, SheldonGrade, Buyer } from "@/types/coin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, DollarSign, Users, Edit } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Sales() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBuyerDialogOpen, setIsBuyerDialogOpen] = useState(false);
  const [isLinkBuyerDialogOpen, setIsLinkBuyerDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [selectedSaleForBuyer, setSelectedSaleForBuyer] = useState<Sale | null>(null);
  const [formData, setFormData] = useState<Partial<Sale>>({});
  const [buyerFormData, setBuyerFormData] = useState<Partial<Buyer>>({});
  const [selectedCoinId, setSelectedCoinId] = useState<string>("");
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSalesByYear();
  }, [sales, selectedYear]);

  const loadData = async () => {
    try {
      const { data: coinsData } = await userCoinService.getUserCoins();
      const { data: salesData } = await userSalesService.getUserSales();
      const { data: buyersData } = await userSalesService.getBuyers();
      
      console.log("Raw sales data:", salesData);
      
      if (coinsData) {
        const mappedCoins: Coin[] = coinsData.map((c) => ({
          id: c.id,
          sku: c.sku,
          coinName: c.coin_name,
          countryCode: c.country_code,
          kmNumber: c.km_number,
          year: c.year,
          mintmark: c.mintmark,
          metal: c.metal as "gold" | "silver" | "copper" | "platinum" | "palladium" | "other",
          purity: c.purity,
          weight: c.weight,
          sheldonGrade: c.grade as SheldonGrade,
          purchasePrice: c.purchase_price,
          purchaseDate: c.purchase_date,
          notes: c.notes,
          obverseImageUrl: c.obverse_image_url,
          reverseImageUrl: c.reverse_image_url,
          isSold: c.is_sold
        }));
        setCoins(mappedCoins);
      }

      if (buyersData) {
        const mappedBuyers: Buyer[] = buyersData.map((b) => ({
          id: b.id,
          firstName: b.first_name,
          lastName: b.last_name,
          email: b.email,
          phone: b.phone || undefined,
          address: b.address || undefined,
          postcode: b.postcode || undefined,
          city: b.city || undefined,
          createdAt: b.created_at
        }));
        setBuyers(mappedBuyers);
      }

      if (salesData && Array.isArray(salesData)) {
        const mappedSales: Sale[] = salesData
          .filter((s) => s && s.id)
          .map((s) => {
            let buyerData = undefined;
            
            if (s.buyer) {
              const rawBuyer = Array.isArray(s.buyer) ? s.buyer[0] : s.buyer;
              if (rawBuyer && rawBuyer.id) {
                buyerData = {
                  id: rawBuyer.id,
                  firstName: rawBuyer.first_name || "",
                  lastName: rawBuyer.last_name || "",
                  email: rawBuyer.email || "",
                  phone: rawBuyer.phone || undefined,
                  address: rawBuyer.address || undefined,
                  postcode: rawBuyer.postcode || undefined,
                  city: rawBuyer.city || undefined,
                  createdAt: rawBuyer.created_at || new Date().toISOString()
                };
              }
            }
            
            return {
              id: s.id,
              coinId: s.coin_id || "",
              saleDate: s.sale_date || new Date().toISOString(),
              salePrice: s.sale_price || 0,
              buyerInfo: s.buyer_info || "",
              buyerId: s.buyer_id || undefined,
              notes: s.notes || "",
              sku: s.sku || "",
              coinName: s.coin_name || "",
              purchasePrice: s.purchase_price || 0,
              profit: s.profit || 0,
              markupPercentage: s.markup_percentage || 0,
              buyer: buyerData
            };
          });
        
        console.log("Mapped sales:", mappedSales);
        setSales(mappedSales);
      } else {
        setSales([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data. Please refresh the page.");
    }
  };

  const filterSalesByYear = () => {
    if (selectedYear === "all") {
      setFilteredSales(sales);
    } else {
      const filtered = sales.filter(sale => {
        const saleYear = new Date(sale.saleDate).getFullYear().toString();
        return saleYear === selectedYear;
      });
      setFilteredSales(filtered);
    }
  };

  const availableYears = Array.from(new Set(sales.map(sale => 
    new Date(sale.saleDate).getFullYear().toString()
  ))).sort((a, b) => parseInt(b) - parseInt(a));

  const availableCoins = coins.filter(coin => !coin.isSold);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCoinId || !formData.saleDate || !formData.salePrice) {
      alert("Please fill in all required fields");
      return;
    }

    const newSale = {
      coin_id: selectedCoinId,
      sale_date: formData.saleDate,
      sale_price: formData.salePrice,
      buyer_id: selectedBuyerId || null,
      buyer_info: formData.buyerInfo || "",
      notes: formData.notes || "",
      purchase_price: 0,
      markup_percentage: 0,
      profit: 0
    };

    const { error: saleError } = await userSalesService.addSale(newSale);
    if (saleError) {
      alert(`Failed to record sale: ${saleError.message}`);
      return;
    }

    const { error: updateError } = await userCoinService.updateUserCoin(selectedCoinId, { 
      is_sold: true
    });
    if (updateError) {
      alert(`Failed to mark coin as sold: ${updateError.message}`);
      return;
    }

    await loadData();
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!buyerFormData.firstName || !buyerFormData.lastName || !buyerFormData.email) {
      alert("Please fill in all required fields");
      return;
    }

    const buyerData = {
      first_name: buyerFormData.firstName,
      last_name: buyerFormData.lastName,
      email: buyerFormData.email,
      phone: buyerFormData.phone || null,
      address: buyerFormData.address || null,
      postcode: buyerFormData.postcode || null,
      city: buyerFormData.city || null
    };

    if (editingBuyer) {
      const { error } = await userSalesService.updateBuyer(editingBuyer.id, buyerData);
      if (error) {
        alert(`Failed to update buyer: ${error.message}`);
        return;
      }
    } else {
      const { error } = await userSalesService.addBuyer(buyerData);
      if (error) {
        alert(`Failed to add buyer: ${error.message}`);
        return;
      }
    }

    await loadData();
    resetBuyerForm();
    setIsBuyerDialogOpen(false);
  };

  const handleLinkBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSaleForBuyer || !selectedBuyerId) {
      alert("Please select a buyer");
      return;
    }

    const { error } = await userSalesService.updateSale(selectedSaleForBuyer.id, {
      buyer_id: selectedBuyerId
    });

    if (error) {
      alert(`Failed to link buyer: ${error.message}`);
      return;
    }

    await loadData();
    setIsLinkBuyerDialogOpen(false);
    setSelectedSaleForBuyer(null);
    setSelectedBuyerId("");
  };

  const resetForm = () => {
    setFormData({});
    setSelectedCoinId("");
    setSelectedBuyerId("");
  };

  const resetBuyerForm = () => {
    setBuyerFormData({});
    setEditingBuyer(null);
  };

  const openEditBuyer = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    setBuyerFormData({
      firstName: buyer.firstName,
      lastName: buyer.lastName,
      email: buyer.email,
      phone: buyer.phone,
      address: buyer.address,
      postcode: buyer.postcode,
      city: buyer.city
    });
    setIsBuyerDialogOpen(true);
  };

  const openLinkBuyerDialog = (sale: Sale) => {
    console.log("Opening link buyer dialog for sale:", sale);
    if (!sale || !sale.id) {
      console.error("Invalid sale data", sale);
      alert("Error: Invalid sale data. Please refresh the page.");
      return;
    }
    console.log("Setting selected sale:", sale);
    console.log("Current buyer ID:", sale.buyerId);
    setSelectedSaleForBuyer(sale);
    setSelectedBuyerId(sale.buyerId || "");
    setIsLinkBuyerDialogOpen(true);
    console.log("Link buyer dialog should now be open");
  };

  const getCoinById = (coinId: string): Coin | undefined => {
    return coins.find(c => c.id === coinId);
  };

  const calculateProfit = (sale: Sale): number => {
    const coin = getCoinById(sale.coinId);
    if (!coin) return 0;
    return sale.salePrice - coin.purchasePrice;
  };

  const calculateMarkup = (sale: Sale): number => {
    const coin = getCoinById(sale.coinId);
    if (!coin || coin.purchasePrice === 0) return 0;
    return ((sale.salePrice - coin.purchasePrice) / coin.purchasePrice) * 100;
  };

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.salePrice, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + calculateProfit(sale), 0);
  const totalCost = filteredSales.reduce((sum, sale) => {
    const coin = getCoinById(sale.coinId);
    return sum + (coin?.purchasePrice || 0);
  }, 0);
  const averageMarkup = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

  return (
    <Layout>
      <SEO 
        title="Sales Records - NumiVault"
        description="Track your coin sales and profit margins"
      />

      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-2">
              Sales Records
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {filteredSales.length} {selectedYear !== "all" ? `sales in ${selectedYear}` : "total sales"} • {spotPriceService.formatCHF(totalProfit)} profit
            </p>
          </div>

          <div className="flex gap-2">
            <Dialog open={isBuyerDialogOpen} onOpenChange={(open) => {
              setIsBuyerDialogOpen(open);
              if (!open) resetBuyerForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-brand-primary text-brand-primary hover:bg-brand-muted">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Buyers
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{editingBuyer ? "Edit Buyer" : "Add New Buyer"}</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleBuyerSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                      <Input
                        id="firstName"
                        value={buyerFormData.firstName || ""}
                        onChange={(e) => setBuyerFormData({...buyerFormData, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={buyerFormData.lastName || ""}
                        onChange={(e) => setBuyerFormData({...buyerFormData, lastName: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={buyerFormData.email || ""}
                        onChange={(e) => setBuyerFormData({...buyerFormData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={buyerFormData.phone || ""}
                        onChange={(e) => setBuyerFormData({...buyerFormData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                    <Input
                      id="address"
                      value={buyerFormData.address || ""}
                      onChange={(e) => setBuyerFormData({...buyerFormData, address: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postcode" className="text-sm font-medium">Postcode</Label>
                      <Input
                        id="postcode"
                        value={buyerFormData.postcode || ""}
                        onChange={(e) => setBuyerFormData({...buyerFormData, postcode: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input
                        id="city"
                        value={buyerFormData.city || ""}
                        onChange={(e) => setBuyerFormData({...buyerFormData, city: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsBuyerDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90">
                      {editingBuyer ? "Update Buyer" : "Add Buyer"}
                    </Button>
                  </div>
                </form>

                {buyers.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-4">Existing Buyers</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {buyers.map(buyer => (
                        <div key={buyer.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-brand-muted/30">
                          <div>
                            <p className="font-medium">{buyer.firstName} {buyer.lastName}</p>
                            <p className="text-sm text-gray-500">{buyer.email}</p>
                            {buyer.city && <p className="text-sm text-gray-500">{buyer.city}</p>}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditBuyer(buyer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 shadow-lg" 
                  disabled={availableCoins.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Sale
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">Record New Sale</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="coin" className="text-sm font-medium">Select Coin *</Label>
                    <Select 
                      value={selectedCoinId} 
                      onValueChange={setSelectedCoinId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a coin to sell" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableCoins.map(coin => (
                          <SelectItem key={coin.id} value={coin.id}>
                            {coin.sku} - {coin.year} ({coin.mintmark || "No mintmark"}) - Grade {coin.sheldonGrade} - Purchased at {spotPriceService.formatCHF(coin.purchasePrice)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="saleDate" className="text-sm font-medium">Sale Date *</Label>
                      <Input
                        id="saleDate"
                        type="date"
                        value={formData.saleDate || ""}
                        onChange={(e) => setFormData({...formData, saleDate: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="salePrice" className="text-sm font-medium">Sale Price (CHF) *</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        value={formData.salePrice || ""}
                        onChange={(e) => setFormData({...formData, salePrice: parseFloat(e.target.value)})}
                        placeholder="e.g., 35.50"
                        required
                      />
                    </div>
                  </div>

                  {selectedCoinId && (
                    <Card className="bg-gradient-to-br from-brand-muted to-white dark:from-gray-800 dark:to-gray-900 border-brand-primary/20">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <p className="font-medium text-gray-700 dark:text-gray-300">
                            Purchase Price: {spotPriceService.formatCHF(getCoinById(selectedCoinId)?.purchasePrice || 0)}
                          </p>
                          {formData.salePrice && (
                            <>
                              <p className={`font-medium ${(formData.salePrice - (getCoinById(selectedCoinId)?.purchasePrice || 0)) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                Profit: {spotPriceService.formatCHF(formData.salePrice - (getCoinById(selectedCoinId)?.purchasePrice || 0))}
                              </p>
                              <p className="font-medium text-brand-primary">
                                Markup: {(((formData.salePrice - (getCoinById(selectedCoinId)?.purchasePrice || 0)) / (getCoinById(selectedCoinId)?.purchasePrice || 1)) * 100).toFixed(2)}%
                              </p>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div>
                    <Label htmlFor="buyer" className="text-sm font-medium">Select Buyer (Optional)</Label>
                    <Select 
                      value={selectedBuyerId} 
                      onValueChange={setSelectedBuyerId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a buyer (optional)" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="">No buyer selected</SelectItem>
                        {buyers.map(buyer => (
                          <SelectItem key={buyer.id} value={buyer.id}>
                            {buyer.firstName} {buyer.lastName} - {buyer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="buyerInfo" className="text-sm font-medium">Buyer Information (Legacy)</Label>
                    <Input
                      id="buyerInfo"
                      value={formData.buyerInfo || ""}
                      onChange={(e) => setFormData({...formData, buyerInfo: e.target.value})}
                      placeholder="Name, platform, or reference"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional sale details"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90">
                      Record Sale
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Dialog open={isLinkBuyerDialogOpen} onOpenChange={(open) => {
          setIsLinkBuyerDialogOpen(open);
          if (!open) {
            setSelectedSaleForBuyer(null);
            setSelectedBuyerId("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Buyer to Sale</DialogTitle>
            </DialogHeader>
            {selectedSaleForBuyer && selectedSaleForBuyer.id && (
              <form onSubmit={handleLinkBuyer} className="space-y-4">
                <div>
                  <Label htmlFor="linkBuyer" className="text-sm font-medium">Select Buyer</Label>
                  <Select 
                    value={selectedBuyerId} 
                    onValueChange={setSelectedBuyerId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a buyer" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="">Remove buyer link</SelectItem>
                      {buyers.map(buyer => (
                        <SelectItem key={buyer.id} value={buyer.id}>
                          {buyer.firstName} {buyer.lastName} - {buyer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsLinkBuyerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90">
                    Link Buyer
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <div className="flex gap-4 items-center">
          <Label htmlFor="yearFilter" className="text-sm font-medium whitespace-nowrap">Filter by Year:</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </CardTitle>
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {spotPriceService.formatCHF(totalRevenue)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Profit
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {spotPriceService.formatCHF(totalProfit)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Average Markup
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {averageMarkup.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sales Count
                </CardTitle>
                <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {filteredSales.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Sales History</CardTitle>
            <CardDescription className="text-base">Complete record of all coin sales in CHF</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSales.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Coin</TableHead>
                      <TableHead className="font-semibold">Purchase Price</TableHead>
                      <TableHead className="font-semibold">Sale Price</TableHead>
                      <TableHead className="font-semibold">Profit</TableHead>
                      <TableHead className="font-semibold">Markup</TableHead>
                      <TableHead className="font-semibold">Buyer</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map(sale => {
                      if (!sale || !sale.id) {
                        return null;
                      }
                      
                      const coin = getCoinById(sale.coinId);
                      const profit = calculateProfit(sale);
                      const markup = calculateMarkup(sale);
                      
                      return (
                        <TableRow key={sale.id} className="hover:bg-brand-muted/30">
                          <TableCell className="font-medium">
                            {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('de-CH') : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{coin ? `${coin.sku}` : "Unknown"}</div>
                            <div className="text-sm text-gray-500">
                              {coin ? `${coin.year}${coin.mintmark ? ` (${coin.mintmark})` : ""} • ${coin.sheldonGrade}` : ""}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {spotPriceService.formatCHF(coin?.purchasePrice || 0)}
                          </TableCell>
                          <TableCell className="font-medium text-brand-primary">
                            {spotPriceService.formatCHF(sale.salePrice)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {profit >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                              <span className={profit >= 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                                {spotPriceService.formatCHF(Math.abs(profit))}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={markup >= 0 ? "default" : "destructive"} 
                              className={markup >= 0 ? "bg-gradient-to-r from-brand-primary to-brand-secondary" : ""}
                            >
                              {markup >= 0 ? "+" : ""}{markup.toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {sale.buyer ? (
                              <div>
                                <p className="font-medium">{sale.buyer.firstName} {sale.buyer.lastName}</p>
                                <p className="text-gray-500">{sale.buyer.email}</p>
                              </div>
                            ) : sale.buyerInfo ? (
                              <span className="text-gray-500">{sale.buyerInfo}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openLinkBuyerDialog(sale)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                  {selectedYear !== "all" ? `No sales in ${selectedYear}` : "No sales recorded yet"}
                </p>
                {availableCoins.length > 0 && selectedYear === "all" && (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Record Your First Sale
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}