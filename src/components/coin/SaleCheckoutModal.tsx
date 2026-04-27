import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { userSalesService } from "@/services/userSalesService";
import { userCoinService } from "@/services/userCoinService";
import { spotPriceService } from "@/lib/spotPrices";
import type { CoinWithReference, Buyer } from "@/types/coin";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, DollarSign, Users, Plus } from "lucide-react";

interface SaleCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coin: CoinWithReference | null;
  onSaleCompleted?: () => void;
}

export function SaleCheckoutModal({ 
  open, 
  onOpenChange, 
  coin,
  onSaleCompleted 
}: SaleCheckoutModalProps) {
  const { toast } = useToast();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("none");
  const [showNewBuyerForm, setShowNewBuyerForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sale form data
  const [saleData, setSaleData] = useState({
    saleDate: new Date().toISOString().split('T')[0],
    salePrice: 0,
    shippingCost: 0,
    platformFees: 0,
    buyerInfo: "",
    notes: ""
  });

  // New buyer form data
  const [newBuyerData, setNewBuyerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    platform: "Direct"
  });

  useEffect(() => {
    loadBuyers();
  }, []);

  useEffect(() => {
    if (open && coin) {
      // Reset form when modal opens
      setSaleData({
        saleDate: new Date().toISOString().split('T')[0],
        salePrice: 0,
        shippingCost: 0,
        platformFees: 0,
        buyerInfo: "",
        notes: ""
      });
      setSelectedBuyerId("none");
      setShowNewBuyerForm(false);
    }
  }, [open, coin]);

  const loadBuyers = async () => {
    const { data, error } = await userSalesService.getBuyers();
    if (data) {
      const mappedBuyers: Buyer[] = data.map((b: any) => ({
        id: b.id,
        firstName: b.first_name,
        lastName: b.last_name,
        email: b.email,
        phone: b.phone || undefined,
        address: b.address || undefined,
        postcode: b.postcode || undefined,
        city: b.city || undefined,
        platform: b.platform || undefined,
        createdAt: b.created_at
      }));
      setBuyers(mappedBuyers);
    }
  };

  const calculateProfit = () => {
    if (!coin) return 0;
    return saleData.salePrice - coin.purchasePrice - saleData.shippingCost - saleData.platformFees;
  };

  const calculateMarkup = () => {
    if (!coin || coin.purchasePrice === 0) return 0;
    return ((saleData.salePrice - coin.purchasePrice) / coin.purchasePrice) * 100;
  };

  const handleCreateNewBuyer = async () => {
    if (!newBuyerData.firstName || !newBuyerData.lastName || !newBuyerData.email) {
      toast({
        title: "Champs requis manquants",
        description: "Prénom, nom et email sont obligatoires",
        variant: "destructive"
      });
      return null;
    }

    const buyerDataToInsert = {
      first_name: newBuyerData.firstName,
      last_name: newBuyerData.lastName,
      email: newBuyerData.email,
      phone: newBuyerData.phone || null,
      platform: newBuyerData.platform
    };

    const { data, error } = await userSalesService.addBuyer(buyerDataToInsert);
    
    if (error) {
      toast({
        title: "Erreur",
        description: `Impossible de créer l'acheteur: ${error.message}`,
        variant: "destructive"
      });
      return null;
    }

    if (data && data.length > 0) {
      await loadBuyers();
      return data[0].id;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coin) return;

    if (!saleData.salePrice || saleData.salePrice <= 0) {
      toast({
        title: "Prix de vente requis",
        description: "Veuillez entrer un prix de vente valide",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let buyerIdToUse = selectedBuyerId !== "none" ? selectedBuyerId : null;

      // If user wants to create a new buyer
      if (showNewBuyerForm) {
        const newBuyerId = await handleCreateNewBuyer();
        if (!newBuyerId) {
          setIsSubmitting(false);
          return;
        }
        buyerIdToUse = newBuyerId;
      }

      // Create the sale
      const saleToInsert = {
        coin_id: coin.id,
        sale_date: saleData.saleDate,
        sale_price: saleData.salePrice,
        shipping_cost: saleData.shippingCost,
        platform_fees: saleData.platformFees,
        buyer_id: buyerIdToUse,
        buyer_info: saleData.buyerInfo || "",
        notes: saleData.notes || "",
        purchase_price: coin.purchasePrice,
        profit: calculateProfit(),
        markup_percentage: calculateMarkup()
      };

      const { error: saleError } = await userSalesService.addSale(saleToInsert);
      
      if (saleError) {
        toast({
          title: "Erreur lors de l'enregistrement de la vente",
          description: saleError.message,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Mark coin as sold
      const { error: updateError } = await userCoinService.updateUserCoin(coin.id, { 
        is_sold: true
      });

      if (updateError) {
        toast({
          title: "Erreur",
          description: "Vente enregistrée mais impossible de marquer la pièce comme vendue",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Vente enregistrée !",
        description: `${coin.coinName} vendue avec succès pour ${spotPriceService.formatCHF(saleData.salePrice)}`,
      });

      onOpenChange(false);
      if (onSaleCompleted) {
        onSaleCompleted();
      }
    } catch (error) {
      console.error("Error during sale:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!coin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Vendre : {coin.coinName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coin Information Card */}
          <Card className="bg-gradient-to-br from-brand-muted/30 to-transparent border-brand-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">SKU</p>
                  <p className="font-medium">{coin.sku}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Grade</p>
                  <p className="font-medium">{coin.sheldonGrade}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Prix d'achat</p>
                  <p className="font-medium">{spotPriceService.formatCHF(coin.purchasePrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Métal</p>
                  <p className="font-medium capitalize">{coin.coins_reference?.metal || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="saleDate">Date de vente *</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleData.saleDate}
                onChange={(e) => setSaleData({...saleData, saleDate: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="salePrice">Prix de vente (CHF) *</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                value={saleData.salePrice || ""}
                onChange={(e) => setSaleData({...saleData, salePrice: parseFloat(e.target.value) || 0})}
                placeholder="ex: 35.50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingCost">Frais d'expédition (CHF)</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={saleData.shippingCost || ""}
                onChange={(e) => setSaleData({...saleData, shippingCost: parseFloat(e.target.value) || 0})}
                placeholder="ex: 5.00"
              />
            </div>

            <div>
              <Label htmlFor="platformFees">Frais de plateforme (CHF)</Label>
              <Input
                id="platformFees"
                type="number"
                step="0.01"
                value={saleData.platformFees || ""}
                onChange={(e) => setSaleData({...saleData, platformFees: parseFloat(e.target.value) || 0})}
                placeholder="ex: 2.50"
              />
            </div>
          </div>

          {/* Profit Calculation Card */}
          {saleData.salePrice > 0 && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Profit Net</p>
                      <p className={`text-lg font-bold ${calculateProfit() >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {spotPriceService.formatCHF(calculateProfit())}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Marge</p>
                      <p className="text-lg font-bold text-green-600">
                        {calculateMarkup().toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Buyer Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Acheteur</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewBuyerForm(!showNewBuyerForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {showNewBuyerForm ? "Sélectionner existant" : "Nouvel acheteur"}
              </Button>
            </div>

            {showNewBuyerForm ? (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newBuyerFirstName">Prénom *</Label>
                    <Input
                      id="newBuyerFirstName"
                      value={newBuyerData.firstName}
                      onChange={(e) => setNewBuyerData({...newBuyerData, firstName: e.target.value})}
                      required={showNewBuyerForm}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newBuyerLastName">Nom *</Label>
                    <Input
                      id="newBuyerLastName"
                      value={newBuyerData.lastName}
                      onChange={(e) => setNewBuyerData({...newBuyerData, lastName: e.target.value})}
                      required={showNewBuyerForm}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="newBuyerEmail">Email *</Label>
                  <Input
                    id="newBuyerEmail"
                    type="email"
                    value={newBuyerData.email}
                    onChange={(e) => setNewBuyerData({...newBuyerData, email: e.target.value})}
                    required={showNewBuyerForm}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newBuyerPhone">Téléphone</Label>
                    <Input
                      id="newBuyerPhone"
                      type="tel"
                      value={newBuyerData.phone}
                      onChange={(e) => setNewBuyerData({...newBuyerData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newBuyerPlatform">Plateforme</Label>
                    <Select
                      value={newBuyerData.platform}
                      onValueChange={(val) => setNewBuyerData({...newBuyerData, platform: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Direct">Vente Directe</SelectItem>
                        <SelectItem value="Ricardo">Ricardo</SelectItem>
                        <SelectItem value="eBay">eBay</SelectItem>
                        <SelectItem value="Other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <Select value={selectedBuyerId} onValueChange={setSelectedBuyerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un acheteur (optionnel)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Aucun acheteur</SelectItem>
                  {buyers.map(buyer => (
                    <SelectItem key={buyer.id} value={buyer.id}>
                      {buyer.firstName} {buyer.lastName} - {buyer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Legacy Buyer Info */}
          {!showNewBuyerForm && selectedBuyerId === "none" && (
            <div>
              <Label htmlFor="buyerInfo">Info acheteur (legacy)</Label>
              <Input
                id="buyerInfo"
                value={saleData.buyerInfo}
                onChange={(e) => setSaleData({...saleData, buyerInfo: e.target.value})}
                placeholder="Nom, plateforme ou référence"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={saleData.notes}
              onChange={(e) => setSaleData({...saleData, notes: e.target.value})}
              placeholder="Détails supplémentaires sur la vente"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer la vente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}