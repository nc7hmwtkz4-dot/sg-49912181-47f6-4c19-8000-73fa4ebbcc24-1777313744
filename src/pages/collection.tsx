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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Coins as CoinsIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Collection() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
    if (searchTerm) {
      const filtered = coins.filter(coin => 
        coin.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.countryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.kmNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        COUNTRY_CODES[coin.countryCode]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCoins(filtered);
    } else {
      setFilteredCoins(coins);
    }
  }, [searchTerm, coins]);

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
        !formData.sheldonGrade || !formData.purchasePrice || !formData.purchaseDate) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingCoin) {
      storageService.updateCoin(editingCoin.id, formData);
    } else {
      const newCoin: Coin = {
        id: storageService.generateId(),
        sku: storageService.generateSKU(formData.countryCode, formData.kmNumber),
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

  const handleEdit = (coin: Coin) => {
    setEditingCoin(coin);
    setFormData(coin);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (coinId: string) => {
    if (confirm("Are you sure you want to delete this coin?")) {
      storageService.deleteCoin(coinId);
      loadCoins();
    }
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

  const groupedCoins = filteredCoins.reduce((acc, coin) => {
    if (!acc[coin.sku]) {
      acc[coin.sku] = [];
    }
    acc[coin.sku].push(coin);
    return acc;
  }, {} as Record<string, Coin[]>);

  return (
    <Layout>
      <SEO 
        title="Coin Collection - NumiVault"
        description="Manage your numismatic collection"
      />

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-2">
              Coin Collection
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {coins.length} total coins • {Object.keys(groupedCoins).length} unique SKUs
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Coin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{editingCoin ? "Edit Coin" : "Add New Coin"}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="countryCode" className="text-sm font-medium">Country Code *</Label>
                    <Select 
                      value={formData.countryCode} 
                      onValueChange={(value) => setFormData({...formData, countryCode: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {Object.entries(COUNTRY_CODES).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {code} - {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="kmNumber" className="text-sm font-medium">KM Number *</Label>
                    <Input
                      id="kmNumber"
                      value={formData.kmNumber || ""}
                      onChange={(e) => setFormData({...formData, kmNumber: e.target.value})}
                      placeholder="e.g., 123"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="year" className="text-sm font-medium">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year || ""}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      placeholder="e.g., 1964"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="mintmark" className="text-sm font-medium">Mintmark</Label>
                    <Input
                      id="mintmark"
                      value={formData.mintmark || ""}
                      onChange={(e) => setFormData({...formData, mintmark: e.target.value})}
                      placeholder="e.g., D, S, P"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metal" className="text-sm font-medium">Metal *</Label>
                    <Select 
                      value={formData.metal} 
                      onValueChange={(value) => setFormData({...formData, metal: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="copper">Copper</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                        <SelectItem value="palladium">Palladium</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="purity" className="text-sm font-medium">Purity (%) *</Label>
                    <Input
                      id="purity"
                      type="number"
                      step="0.01"
                      value={formData.purity || ""}
                      onChange={(e) => setFormData({...formData, purity: parseFloat(e.target.value)})}
                      placeholder="e.g., 90"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="weight" className="text-sm font-medium">Weight (grams) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight || ""}
                      onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value)})}
                      placeholder="e.g., 31.1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sheldonGrade" className="text-sm font-medium">Sheldon Grade *</Label>
                    <Select 
                      value={formData.sheldonGrade} 
                      onValueChange={(value) => setFormData({...formData, sheldonGrade: value as any})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {SHELDON_GRADES.map(grade => (
                          <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="purchasePrice" className="text-sm font-medium">Purchase Price (CHF) *</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice || ""}
                      onChange={(e) => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})}
                      placeholder="e.g., 25.50"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="purchaseDate" className="text-sm font-medium">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate || ""}
                      onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="imageUrl" className="text-sm font-medium">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl || ""}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      placeholder="https://example.com/coin.jpg"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional information about this coin"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90">
                    {editingCoin ? "Update" : "Add"} Coin
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by SKU, country, or KM number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedCoins).map(([sku, skuCoins]) => {
            const totalBullionValue = skuCoins.reduce((sum, coin) => sum + calculateBullionValue(coin), 0);
            
            return (
              <Card key={sku} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-brand-muted to-white dark:from-gray-800 dark:to-gray-900">
                  <CardTitle className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <CoinsIcon className="w-6 h-6 text-brand-primary" />
                      <span className="text-2xl font-bold">{sku}</span>
                      <Badge variant="outline" className="text-sm border-brand-primary text-brand-primary">
                        {COUNTRY_CODES[skuCoins[0].countryCode]}
                      </Badge>
                      <Badge className="bg-gradient-to-r from-brand-primary to-brand-secondary">
                        {skuCoins.length} coin{skuCoins.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {spotPrices && (
                      <div className="text-sm font-normal text-brand-primary">
                        Total Bullion: {spotPriceService.formatCHF(totalBullionValue)}
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base">
                    KM#{skuCoins[0].kmNumber} • {skuCoins[0].metal.charAt(0).toUpperCase() + skuCoins[0].metal.slice(1)} • {skuCoins[0].purity}% purity • {skuCoins[0].weight}g
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Mintmark</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Purchase Price</TableHead>
                        <TableHead>Bullion Value</TableHead>
                        <TableHead>Purchase Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {skuCoins.map(coin => (
                        <TableRow key={coin.id} className="hover:bg-brand-muted/30">
                          <TableCell className="font-semibold">{coin.year}</TableCell>
                          <TableCell>{coin.mintmark || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">{coin.sheldonGrade}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{spotPriceService.formatCHF(coin.purchasePrice)}</TableCell>
                          <TableCell className="font-medium text-brand-primary">
                            {spotPrices ? spotPriceService.formatCHF(calculateBullionValue(coin)) : "-"}
                          </TableCell>
                          <TableCell>{new Date(coin.purchaseDate).toLocaleDateString('de-CH')}</TableCell>
                          <TableCell>
                            {coin.isSold ? (
                              <Badge variant="destructive">Sold</Badge>
                            ) : (
                              <Badge className="bg-green-600">Available</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(coin)}
                                className="hover:bg-brand-primary/10"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(coin.id)}
                                className="hover:bg-red-100 dark:hover:bg-red-950"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}

          {filteredCoins.length === 0 && (
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CoinsIcon className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                  {searchTerm ? "No coins found matching your search" : "No coins in your collection yet"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90">
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