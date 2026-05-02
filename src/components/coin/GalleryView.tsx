import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Edit, DollarSign, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import type { Coin } from "@/types/coin";
import { spotPriceService } from "@/lib/spotPrices";
import { ImageViewer } from "@/components/ImageViewer";

interface GalleryViewProps {
  coins: Coin[];
  onEditCoin: (coin: Coin) => void;
  onDeleteCoin: (coinId: string) => void;
  onSellCoin: (coin: Coin) => void;
  calculateBullionValue: (coin: Coin) => number;
}

interface CoinGroup {
  modelName: string;
  countryCode: string;
  metal: string;
  weight: number;
  purity: number;
  obverseImageUrl: string;
  reverseImageUrl: string;
  coins: Coin[];
  totalValue: number;
  totalCost: number;
  unsoldCount: number;
  soldCount: number;
  yearRange: string;
}

export function GalleryView({ coins, onEditCoin, onDeleteCoin, onSellCoin, calculateBullionValue }: GalleryViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  // Group coins by model (coin_name)
  const groupedCoins: Record<string, CoinGroup> = coins.reduce((acc, coin) => {
    const key = coin.coinName || "Unknown";
    
    if (!acc[key]) {
      const years = coins
        .filter(c => c.coinName === coin.coinName)
        .map(c => c.year)
        .sort((a, b) => a - b);
      
      const yearRange = years.length > 0 
        ? years.length === 1 
          ? `${years[0]}`
          : `${years[0]} - ${years[years.length - 1]}`
        : "N/A";

      acc[key] = {
        modelName: key,
        countryCode: coin.countryCode,
        metal: coin.metal,
        weight: coin.weight,
        purity: coin.purity,
        obverseImageUrl: coin.obverseImageUrl,
        reverseImageUrl: coin.reverseImageUrl,
        coins: [],
        totalValue: 0,
        totalCost: 0,
        unsoldCount: 0,
        soldCount: 0,
        yearRange
      };
    }

    acc[key].coins.push(coin);
    acc[key].totalCost += coin.purchasePrice;
    
    if (!coin.isSold) {
      acc[key].totalValue += calculateBullionValue(coin);
      acc[key].unsoldCount++;
    } else {
      acc[key].soldCount++;
    }

    return acc;
  }, {} as Record<string, CoinGroup>);

  const sortedGroups = Object.values(groupedCoins).sort((a, b) => 
    b.coins.length - a.coins.length
  );

  const toggleGroup = (modelName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(modelName)) {
      newExpanded.delete(modelName);
    } else {
      newExpanded.add(modelName);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.modelName);
          const unrealizedPL = group.totalValue - group.totalCost;
          const unrealizedPLPercent = group.totalCost > 0 ? (unrealizedPL / group.totalCost) * 100 : 0;

          return (
            <Card key={group.modelName} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors pb-3"
                onClick={() => toggleGroup(group.modelName)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {isExpanded ? <ChevronDown className="h-5 w-5 flex-shrink-0" /> : <ChevronRight className="h-5 w-5 flex-shrink-0" />}
                      <CardTitle className="text-lg truncate">{group.modelName}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                      <Badge variant="outline" className="font-mono">
                        {group.countryCode}
                      </Badge>
                      <span>•</span>
                      <span>{group.coins.length} pièce{group.coins.length > 1 ? "s" : ""}</span>
                      <span>•</span>
                      <span>{group.yearRange}</span>
                    </div>
                  </div>
                  <Badge variant={group.unsoldCount > 0 ? "default" : "secondary"}>
                    {group.unsoldCount > 0 ? `${group.unsoldCount} en stock` : "Tout vendu"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Images du modèle */}
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (group.obverseImageUrl) {
                        setSelectedImage({ url: group.obverseImageUrl, title: `${group.modelName} - Avers` });
                      }
                    }}
                  >
                    {group.obverseImageUrl ? (
                      <img 
                        src={group.obverseImageUrl} 
                        alt={`${group.modelName} - Avers`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Avers
                      </div>
                    )}
                  </div>
                  <div 
                    className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (group.reverseImageUrl) {
                        setSelectedImage({ url: group.reverseImageUrl, title: `${group.modelName} - Revers` });
                      }
                    }}
                  >
                    {group.reverseImageUrl ? (
                      <img 
                        src={group.reverseImageUrl} 
                        alt={`${group.modelName} - Revers`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Revers
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistiques agrégées */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Métal</p>
                    <p className="font-medium capitalize">{group.metal}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Poids unitaire</p>
                    <p className="font-medium font-mono">{group.weight.toFixed(2)}g</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Coût total</p>
                    <p className="font-medium font-mono">{spotPriceService.formatCHF(group.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Valeur Spot</p>
                    <p className="font-medium font-mono">{spotPriceService.formatCHF(group.totalValue)}</p>
                  </div>
                </div>

                {/* P/L agrégé */}
                {group.unsoldCount > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">P/L Latent</span>
                      <div className="flex items-center gap-2">
                        {unrealizedPL >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-semibold font-mono ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {spotPriceService.formatCHF(unrealizedPL)}
                        </span>
                        <span className={`text-xs ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({unrealizedPLPercent >= 0 ? '+' : ''}{unrealizedPLPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Détails expandables des pièces individuelles */}
                {isExpanded && (
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-sm font-medium mb-3">Détails des exemplaires ({group.coins.length})</p>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {group.coins
                        .sort((a, b) => a.year - b.year)
                        .map((coin) => {
                          const bullionValue = calculateBullionValue(coin);
                          const coinPL = bullionValue - coin.purchasePrice;
                          
                          return (
                            <div key={coin.id} className="p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{coin.year}</span>
                                    {coin.mintmark && (
                                      <Badge variant="outline" className="text-xs">
                                        {coin.mintmark}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {coin.sheldonGrade}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-mono">{coin.sku}</p>
                                </div>
                                <Badge variant={coin.isSold ? "secondary" : "default"} className="text-xs">
                                  {coin.isSold ? "Vendu" : "En stock"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                <div>
                                  <span className="text-muted-foreground">Achat:</span>
                                  <span className="ml-1 font-mono">{spotPriceService.formatCHF(coin.purchasePrice)}</span>
                                </div>
                                {!coin.isSold && (
                                  <>
                                    <div>
                                      <span className="text-muted-foreground">Spot:</span>
                                      <span className="ml-1 font-mono">{spotPriceService.formatCHF(bullionValue)}</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">P/L:</span>
                                      <span className={`ml-1 font-mono font-semibold ${coinPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {spotPriceService.formatCHF(coinPL)}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditCoin(coin);
                                  }}
                                  className="flex-1"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Modifier
                                </Button>
                                {!coin.isSold && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSellCoin(coin);
                                    }}
                                    className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                                  >
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Vendre
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Supprimer cette pièce ?")) {
                                      onDeleteCoin(coin.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedImage && (
        <ImageViewer
          isOpen={!!selectedImage}
          imageUrl={selectedImage.url}
          alt={selectedImage.title}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
}