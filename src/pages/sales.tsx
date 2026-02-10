import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { storageService } from "@/lib/storage";
import { Coin, Sale } from "@/types/coin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
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

  const loadData = () => {
    const loadedCoins = storageService.getCoins();
    const loadedSales = storageService.getSales();
    setCoins(loadedCoins);
    setSales(loadedSales);
  };

  const availableCoins = coins.filter(coin => !coin.isSold);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCoinId || !formData.saleDate || !formData.salePrice) {
      alert("Please fill in all required fields");
      return;
    }

    const newSale: Sale = {
      id: storageService.generateId(),
      coinId: selectedCoinId,
      saleDate: formData.saleDate,
      salePrice: formData.salePrice,
      buyerInfo: formData.buyerInfo,
      notes: formData.notes
    };

    storageService.addSale(newSale);
    storageService.updateCoin(selectedCoinId, { 
      isSold: true, 
      saleId: newSale.id 
    });

    loadData();
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

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + calculateProfit(sale), 0);
  const totalCost = sales.reduce((sum, sale) => {
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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-amber-700 dark:text-amber-400">Sales Records</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {sales.length} total sales • ${totalProfit.toFixed(2)} profit
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700" disabled={availableCoins.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="coin">Select Coin *</Label>
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
                          {coin.sku} - {coin.year} ({coin.mintmark || "No mintmark"}) - Grade {coin.sheldonGrade} - Purchased at ${coin.purchasePrice.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="saleDate">Sale Date *</Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={formData.saleDate || ""}
                      onChange={(e) => setFormData({...formData, saleDate: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="salePrice">Sale Price ($) *</Label>
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
                  <Card className="bg-amber-50 dark:bg-gray-800 border-amber-200 dark:border-amber-900">
                    <CardContent className="pt-4">
                      <div className="text-sm space-y-1">
                        <p className="font-medium">Purchase Price: ${getCoinById(selectedCoinId)?.purchasePrice.toFixed(2)}</p>
                        {formData.salePrice && (
                          <>
                            <p className={`font-medium ${(formData.salePrice - (getCoinById(selectedCoinId)?.purchasePrice || 0)) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                              Profit: ${(formData.salePrice - (getCoinById(selectedCoinId)?.purchasePrice || 0)).toFixed(2)}
                            </p>
                            <p className="font-medium text-blue-600 dark:text-blue-400">
                              Markup: {(((formData.salePrice - (getCoinById(selectedCoinId)?.purchasePrice || 0)) / (getCoinById(selectedCoinId)?.purchasePrice || 1)) * 100).toFixed(2)}%
                            </p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div>
                  <Label htmlFor="buyerInfo">Buyer Information</Label>
                  <Input
                    id="buyerInfo"
                    value={formData.buyerInfo || ""}
                    onChange={(e) => setFormData({...formData, buyerInfo: e.target.value})}
                    placeholder="Name, platform, or reference"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional sale details"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                    Record Sale
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-2 border-green-200 dark:border-green-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">${totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${totalProfit.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Markup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{averageMarkup.toFixed(2)}%</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Sales Count</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{sales.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
            <CardDescription>Complete record of all coin sales</CardDescription>
          </CardHeader>
          <CardContent>
            {sales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Coin</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Markup</TableHead>
                    <TableHead>Buyer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map(sale => {
                    const coin = getCoinById(sale.coinId);
                    const profit = calculateProfit(sale);
                    const markup = calculateMarkup(sale);
                    
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">
                          {coin ? `${coin.sku} - ${coin.year}${coin.mintmark ? ` (${coin.mintmark})` : ""}` : "Unknown"}
                          <br />
                          <span className="text-xs text-gray-500">{coin?.sheldonGrade}</span>
                        </TableCell>
                        <TableCell>${coin?.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${sale.salePrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {profit >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                              ${Math.abs(profit).toFixed(2)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={markup >= 0 ? "default" : "destructive"} className={markup >= 0 ? "bg-blue-600" : ""}>
                            {markup >= 0 ? "+" : ""}{markup.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{sale.buyerInfo || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No sales recorded yet</p>
                {availableCoins.length > 0 ? (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700">
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