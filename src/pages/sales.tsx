import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { spotPriceService } from "@/lib/spotPrices";
import { userCoinService } from "@/services/userCoinService";
import { userSalesService } from "@/services/userSalesService";
import { Coin, COUNTRY_CODES, Sale, SheldonGrade } from "@/types/coin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Sales() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Sale>>({});
  const [selectedCoinId, setSelectedCoinId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadSales = async () => {
    const { data, error } = await userSalesService.getUserSales();
    
    if (error) {
      console.error("Error loading sales:", error);
      return;
    }

    if (data) {
      // Map database sales to frontend Sale type
      const mappedSales: Sale[] = data.map(s => ({
        id: s.id,
        coinId: s.coin_id,
        sku: s.sku || "", // Handle potentially missing legacy data
        coinName: s.coin_name || "",
        saleDate: s.sale_date,
        salePrice: s.sale_price,
        purchasePrice: s.purchase_price,
        profit: s.profit,
        markupPercentage: s.markup_percentage,
        buyerInfo: s.buyer_info || "",
        notes: s.notes || ""
      }));
      
      setSales(mappedSales);
    }
  };

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
    }
  };

  const loadData = async () => {
    const { data: coinsData } = await userCoinService.getUserCoins();
    const { data: salesData } = await userSalesService.getUserSales();
    
    if (coinsData) {
      const mappedCoins: Coin[] = coinsData.map((c: any) => ({
        id: c.id,
        sku: c.sku,
        coinName: c.coin_name,
        countryCode: c.country_code,
        kmNumber: c.km_number,
        year: c.year,
        mintmark: c.mintmark,
        metal: c.metal,
        purity: c.purity,
        weight: c.weight,
        sheldonGrade: c.sheldon_grade,
        purchasePrice: c.purchase_price,
        purchaseDate: c.purchase_date,
        notes: c.notes,
        obverseImageUrl: c.obverse_image_url,
        reverseImageUrl: c.reverse_image_url,
        isSold: c.is_sold
      }));
      setCoins(mappedCoins);
    }

    if (salesData) {
      const mappedSales: Sale[] = salesData.map((s: any) => ({
        id: s.id,
        coinId: s.coin_id,
        saleDate: s.sale_date,
        salePrice: s.sale_price,
        buyerInfo: s.buyer_info,
        notes: s.notes,
        sku: s.sku || "",
        coinName: s.coin_name || "",
        purchasePrice: s.purchase_price || 0,
        profit: s.profit || 0,
        markupPercentage: s.markup_percentage || 0
      }));
      setSales(mappedSales);
    }
  };

  const availableCoins = coins.filter(coin => !coin.isSold);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCoinId || !formData.saleDate || !formData.salePrice) {
      alert("Please fill in all required fields");
      return;
    }

    // Pass 0 for calculated fields to satisfy Typescript requirements
    // The database trigger will overwrite these with correct values
    const newSale = {
      coin_id: selectedCoinId,
      sale_date: formData.saleDate,
      sale_price: formData.salePrice,
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

  const resetForm = () => {
    setFormData({});
    setSelectedCoinId("");
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

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Are you sure you want to delete this sale record? This will also mark the coin as available again.")) {
      return;
    }

    try {
      const sale = sales.find(s => s.id === saleId);
      if (!sale) return;

      // 1. Delete the sale record
      const { error: deleteError } = await userSalesService.deleteSale(saleId);
      
      if (deleteError) {
        alert("Failed to delete sale. Please try again.");
        console.error("Delete sale error:", deleteError);
        return;
      }

      // 2. Mark coin as available again (not sold)
      const { error: updateError } = await userCoinService.updateUserCoin(sale.coinId, {
        is_sold: false
      });

      if (updateError) {
        console.error("Failed to update coin status:", updateError);
        // Continue anyway - sale is deleted, user can manually fix coin status if needed
      }

      // 3. Reload data
      await loadSales();
      await loadCoins();
      
      alert("Sale deleted successfully!");
    } catch (err) {
      console.error("Error deleting sale:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + calculateProfit(sale), 0);
  const totalCost = sales.reduce((sum, sale) => {
    const coin = getCoinById(sale.coinId);
    return sum + (coin?.purchasePrice || 0);
  }, 0);
  const averageMarkup = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

  console.log("Sales Page Total Profit Calculation:");
  console.log("Sales count:", sales.length);
  console.log("Sales data:", sales.map(s => {
    const coin = getCoinById(s.coinId);
    const profit = s.salePrice - (coin?.purchasePrice || 0);
    return {
      id: s.id,
      salePrice: s.salePrice,
      purchasePrice: coin?.purchasePrice,
      calculatedProfit: profit
    };
  }));
  console.log("Total Profit:", totalProfit);

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
              {sales.length} total sales • {spotPriceService.formatCHF(totalProfit)} profit
            </p>
          </div>

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
                  <Label htmlFor="buyerInfo" className="text-sm font-medium">Buyer Information</Label>
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
                {sales.length}
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
            {sales.length > 0 ? (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map(sale => {
                      const coin = getCoinById(sale.coinId);
                      const profit = calculateProfit(sale);
                      const markup = calculateMarkup(sale);
                      
                      return (
                        <TableRow key={sale.id} className="hover:bg-brand-muted/30">
                          <TableCell className="font-medium">
                            {new Date(sale.saleDate).toLocaleDateString('de-CH')}
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
                            {sale.buyerInfo || "-"}
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
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No sales recorded yet</p>
                {availableCoins.length > 0 ? (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Record Your First Sale
                  </Button>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Add coins to your collection first
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}