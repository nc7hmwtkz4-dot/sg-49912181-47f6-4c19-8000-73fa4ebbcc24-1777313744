import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { storageService } from "@/lib/storage";
import { Coin, COUNTRY_CODES, SHELDON_GRADES } from "@/types/coin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Collection() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCoin, setEditingCoin] = useState<Coin | null>(null);
  const [formData, setFormData] = useState<Partial<Coin>>({
    countryCode: "US",
    metal: "silver",
    purity: 90,
    sheldonGrade: "MS-63"
  });

  useEffect(() => {
    loadCoins();
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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-amber-700 dark:text-amber-400">Coin Collection</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {coins.length} total coins • {Object.keys(groupedCoins).length} unique SKUs
            </p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Coin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCoin ? "Edit Coin" : "Add New Coin"}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="countryCode">Country Code *</Label>
                    <Select 
                      value={formData.countryCode} 
                      onValueChange={(value) => setFormData({...formData, countryCode: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COUNTRY_CODES).map(([code, name]) => (
                          <SelectItem key={code} value={code}>
                            {code} - {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="kmNumber">KM Number *</Label>
                    <Input
                      id="kmNumber"
                      value={formData.kmNumber || ""}
                      onChange={(e) => setFormData({...formData, kmNumber: e.target.value})}
                      placeholder="e.g., 123"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="year">Year *</Label>
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
                    <Label htmlFor="mintmark">Mintmark</Label>
                    <Input
                      id="mintmark"
                      value={formData.mintmark || ""}
                      onChange={(e) => setFormData({...formData, mintmark: e.target.value})}
                      placeholder="e.g., D, S, P"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metal">Metal *</Label>
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
                    <Label htmlFor="purity">Purity (%) *</Label>
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
                    <Label htmlFor="weight">Weight (grams) *</Label>
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
                    <Label htmlFor="sheldonGrade">Sheldon Grade *</Label>
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
                    <Label htmlFor="purchasePrice">Purchase Price ($) *</Label>
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
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate || ""}
                      onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl || ""}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      placeholder="https://example.com/coin.jpg"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional information about this coin"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                    {editingCoin ? "Update" : "Add"} Coin
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by SKU, country, or KM number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedCoins).map(([sku, skuCoins]) => (
            <Card key={sku} className="border-2 border-amber-200 dark:border-amber-900">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sku}</span>
                    <Badge variant="outline" className="text-sm">
                      {COUNTRY_CODES[skuCoins[0].countryCode]}
                    </Badge>
                    <Badge className="bg-amber-600">
                      {skuCoins.length} coin{skuCoins.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  KM#{skuCoins[0].kmNumber} • {skuCoins[0].metal.charAt(0).toUpperCase() + skuCoins[0].metal.slice(1)} • {skuCoins[0].purity}% purity • {skuCoins[0].weight}g
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Mintmark</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skuCoins.map(coin => (
                      <TableRow key={coin.id}>
                        <TableCell className="font-medium">{coin.year}</TableCell>
                        <TableCell>{coin.mintmark || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{coin.sheldonGrade}</Badge>
                        </TableCell>
                        <TableCell>${coin.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell>{new Date(coin.purchaseDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {coin.isSold ? (
                            <Badge variant="destructive">Sold</Badge>
                          ) : (
                            <Badge className="bg-green-600">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(coin)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(coin.id)}
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
          ))}

          {filteredCoins.length === 0 && (
            <Card className="border-2 border-dashed border-amber-300 dark:border-amber-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                  {searchTerm ? "No coins found matching your search" : "No coins in your collection yet"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700">
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