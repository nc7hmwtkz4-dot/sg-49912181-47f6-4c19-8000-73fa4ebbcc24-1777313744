import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { storageService } from "@/lib/storage";
import { spotPriceService } from "@/lib/spotPrices";
import { Coin, COUNTRY_CODES, SHELDON_GRADES } from "@/types/coin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, DollarSign, ShoppingCart, Search, Package } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Collection() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [metalFilter, setMetalFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCoin, setEditingCoin] = useState<Coin | null>(null);
  const [spotPrices, setSpotPrices] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<Coin>>({
    countryCode: "US",
    metal: "silver",
    purity: 90,
    sheldonGrade: "MS-63"
  });

  useEffect(() => {
    loadCoins();
    loadSpotPrices();
  }, []);

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

  const loadCoins = () => {
    const loadedCoins = storageService.getCoins();
    setCoins(loadedCoins);
    setFilteredCoins(loadedCoins);
  };

  const loadSpotPrices = async () => {
    const prices = await spotPriceService.getSpotPrices();
    setSpotPrices(prices);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.countryCode || !formData.kmNumber || !formData.year || 
        !formData.metal || !formData.purity || !formData.weight || 
        !formData.sheldonGrade || !formData.purchasePrice || !formData.purchaseDate ||
        !formData.coinName) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingCoin) {
      storageService.updateCoin(editingCoin.id, formData);
    } else {
      const newCoin: Coin = {
        id: storageService.generateId(),
        sku: storageService.generateSKU(formData.countryCode, formData.kmNumber),
        coinName: formData.coinName,
        countryCode: formData.countryCode,
        kmNumber: formData.kmNumber,
        year: formData.year,
        mintmark: formData.mintmark || "",
        metal: formData.metal as "gold" | "silver" | "copper" | "platinum" | "palladium" | "other",
        purity: formData.purity,
        weight: formData.weight,
        sheldonGrade: formData.sheldonGrade,
        purchasePrice: formData.purchasePrice,
        purchaseDate: formData.purchaseDate,
        notes: formData.notes,
        imageUrl: formData.imageUrl,
        isSold: false
      };
      storageService.addCoin(newCoin);
    }

    loadCoins();
    resetForm();
    setIsAddDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      countryCode: "US",
      metal: "silver",
      purity: 90,
      sheldonGrade: "MS-63"
    });
    setEditingCoin(null);
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

  // Group coins by SKU
  const groupedCoins = filteredCoins.reduce((acc, coin) => {
    if (!acc[coin.sku]) {
      acc[coin.sku] = [];
    }
    acc[coin.sku].push(coin);
    return acc;
  }, {} as Record<string, Coin[]>);

  const uniqueCountries = Array.from(new Set(coins.map(c => c.countryCode))).sort();

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
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <DollarSign className="w-4 h-4 mr-2" />
              Record Sale
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Record Purchase
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
                    {editingCoin ? "Edit Coin" : "Add New Coin"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
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
                        placeholder="e.g., 24"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="year" className="text-slate-300">Year *</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year || ""}
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                        placeholder="e.g., 1875"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="mintmark" className="text-slate-300">Mintmark</Label>
                      <Input
                        id="mintmark"
                        value={formData.mintmark || ""}
                        onChange={(e) => setFormData({...formData, mintmark: e.target.value})}
                        placeholder="e.g., D, S, P"
                        className="bg-slate-800 border-slate-700 text-white"
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

                    <div>
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

                    <div>
                      <Label htmlFor="sheldonGrade" className="text-slate-300">Sheldon Grade *</Label>
                      <Select 
                        value={formData.sheldonGrade} 
                        onValueChange={(value) => setFormData({...formData, sheldonGrade: value as any})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                          {SHELDON_GRADES.map(grade => (
                            <SelectItem key={grade} value={grade} className="text-white">{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="purchasePrice" className="text-slate-300">Purchase Price (CHF) *</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        step="0.01"
                        value={formData.purchasePrice || ""}
                        onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})}
                        placeholder="e.g., 19.06"
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="purchaseDate" className="text-slate-300">Purchase Date *</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={formData.purchaseDate || ""}
                        onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="imageUrl" className="text-slate-300">Image URL</Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl || ""}
                        onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                        placeholder="https://example.com/coin.jpg"
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="notes" className="text-slate-300">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        placeholder="Additional information about this coin"
                        rows={3}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-slate-700">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-600 text-slate-300">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-white text-slate-900 hover:bg-slate-100">
                      {editingCoin ? "Update" : "Add"} Coin
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
                      const totalBullionValue = skuCoins.reduce((sum, c) => sum + calculateBullionValue(c), 0);
                      const totalCost = skuCoins.reduce((sum, c) => sum + c.purchasePrice, 0);

                      return (
                        <Card 
                          key={sku} 
                          className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer overflow-hidden group"
                          onClick={() => {
                            setEditingCoin(coin);
                            setFormData(coin);
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <div className="aspect-square relative bg-slate-900/50 overflow-hidden">
                            {coin.imageUrl ? (
                              <img 
                                src={coin.imageUrl} 
                                alt={coin.coinName || sku}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
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
                            <h3 className="text-white font-semibold line-clamp-2 min-h-[3rem]">
                              {coin.coinName || `${COUNTRY_CODES[coin.countryCode]} Coin`}
                            </h3>
                            <p className="text-slate-400 text-sm font-mono">
                              {sku}
                            </p>
                            
                            <div className="flex items-center gap-2 pt-2">
                              <Package className="w-4 h-4 text-slate-500" />
                              <span className="text-slate-400 text-sm">
                                {skuCoins.length} coin{skuCoins.length > 1 ? 's' : ''}
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
    </Layout>
  );
}