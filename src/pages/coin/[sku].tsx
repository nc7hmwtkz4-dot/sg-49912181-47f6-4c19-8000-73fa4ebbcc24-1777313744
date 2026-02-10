import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { storageService } from "@/lib/storage";
import { spotPriceService } from "@/lib/spotPrices";
import { Coin, COUNTRY_CODES, SHELDON_GRADES } from "@/types/coin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, DollarSign, Trash2, ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";

export default function CoinDetail() {
  const router = useRouter();
  const { sku } = router.query;
  const [coins, setCoins] = useState<Coin[]>([]);
  const [spotPrices, setSpotPrices] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [editingCoin, setEditingCoin] = useState<Coin | null>(null);
  const [saleFormData, setSaleFormData] = useState<{
    coinId: string;
    saleDate: string;
    salePrice: number;
    buyerInfo?: string;
    notes?: string;
  }>({ coinId: "", saleDate: new Date().toISOString().split("T")[0], salePrice: 0 });

  useEffect(() => {
    if (sku) {
      loadCoins();
      loadSpotPrices();
    }
  }, [sku]);

  const loadCoins = () => {
    const allCoins = storageService.getCoins();
    const skuCoins = allCoins.filter(c => c.sku === sku);
    setCoins(skuCoins);
  };

  const loadSpotPrices = async () => {
    const prices = await spotPriceService.getSpotPrices();
    setSpotPrices(prices);
  };

  const handleEditClick = () => {
    const referenceCoin = coins[0];
    setEditingCoin(referenceCoin);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCoin || !editingCoin.coinName || !editingCoin.kmNumber) {
      alert("Please fill in all required fields");
      return;
    }

    const newSKU = storageService.generateSKU(editingCoin.countryCode, editingCoin.kmNumber);
    
    // Update all coins with this SKU
    coins.forEach(coin => {
      storageService.updateCoin(coin.id, {
        ...editingCoin,
        sku: newSKU
      });
    });

    setIsEditDialogOpen(false);
    setEditingCoin(null);
    
    // Navigate to new SKU page if SKU changed
    if (newSKU !== sku) {
      router.push(`/coin/${encodeURIComponent(newSKU)}`);
    } else {
      loadCoins();
    }
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

  const handleRecordSale = (coinId: string) => {
    setSaleFormData({
      coinId,
      saleDate: new Date().toISOString().split("T")[0],
      salePrice: 0
    });
    setIsSaleDialogOpen(true);
  };

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!saleFormData.coinId || !saleFormData.saleDate || !saleFormData.salePrice) {
      alert("Please fill in all required fields");
      return;
    }

    const sale = {
      id: storageService.generateId(),
      coinId: saleFormData.coinId,
      saleDate: saleFormData.saleDate,
      salePrice: saleFormData.salePrice,
      buyerInfo: saleFormData.buyerInfo,
      notes: saleFormData.notes
    };

    storageService.addSale(sale);
    storageService.markCoinAsSold(saleFormData.coinId, sale.id);
    
    loadCoins();
    setIsSaleDialogOpen(false);
    setSaleFormData({ coinId: "", saleDate: new Date().toISOString().split("T")[0], salePrice: 0 });
  };

  const handleDeleteCoin = (coinId: string) => {
    if (confirm("Are you sure you want to delete this coin?")) {
      storageService.deleteCoin(coinId);
      loadCoins();
      
      // If no coins left with this SKU, redirect back to collection
      const remainingCoins = storageService.getCoins().filter(c => c.sku === sku);
      if (remainingCoins.length === 0) {
        router.push("/collection");
      }
    }
  };

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
    const sale = storageService.getSales().find(s => s.id === c.saleId);
    return sum + (sale?.salePrice || 0);
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-white rounded-lg overflow-hidden">
                    {referenceCoin.imageUrl ? (
                      <img 
                        src={referenceCoin.imageUrl} 
                        alt={`${referenceCoin.coinName} - Obverse`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <span className="text-slate-400 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="aspect-square bg-white rounded-lg overflow-hidden">
                    {referenceCoin.imageUrl ? (
                      <img 
                        src={referenceCoin.imageUrl} 
                        alt={`${referenceCoin.coinName} - Reverse`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <span className="text-slate-400 text-sm">No image</span>
                      </div>
                    )}
                  </div>
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
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Metal Content</p>
                    <p className="text-2xl font-semibold">{metalContent}g</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Year</p>
                    <p className="text-2xl font-semibold">{referenceCoin.year}</p>
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

              <Button className="h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
                <DollarSign className="w-5 h-5 mr-2" />
                Record Sale
              </Button>
            </div>
          </div>
        </div>

        {/* Individual Coins Table */}
        <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900 dark:text-white">Individual Coins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-600 dark:text-slate-400">Year</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Mint</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Grade</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Purchase Date</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Purchase Price</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Sale Info</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Notes</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coins.map(coin => {
                    const sale = coin.saleId ? storageService.getSales().find(s => s.id === coin.saleId) : null;
                    return (
                      <TableRow key={coin.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell className="text-slate-900 dark:text-white font-medium">{coin.year}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{coin.mintmark || "-"}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{coin.sheldonGrade}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {new Date(coin.purchaseDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{spotPriceService.formatCHF(coin.purchasePrice)}</TableCell>
                        <TableCell>
                          {coin.isSold ? (
                            <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              Sold
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0">
                              In Collection
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {sale ? (
                            <div className="text-sm">
                              <div>{spotPriceService.formatCHF(sale.salePrice)}</div>
                              <div className="text-xs text-slate-500">
                                {new Date(sale.saleDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {coin.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCoin(coin.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
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
                  onValueChange={(value) => setEditingCoin(editingCoin ? {...editingCoin, metal: value as any} : null)}
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
    </Layout>
  );
}