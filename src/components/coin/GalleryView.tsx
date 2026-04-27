import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, DollarSign, Eye, Trash2 } from "lucide-react";
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

export function GalleryView({ coins, onEditCoin, onDeleteCoin, onSellCoin, calculateBullionValue }: GalleryViewProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {coins.map((coin) => {
          const bullionValue = calculateBullionValue(coin);
          const unrealizedPL = bullionValue - coin.purchasePrice;
          const unrealizedPLPercent = coin.purchasePrice > 0 ? (unrealizedPL / coin.purchasePrice) * 100 : 0;

          return (
            <Card key={coin.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{coin.coinName}</CardTitle>
                    <CardDescription className="mt-1">
                      {coin.year} • {coin.mintmark || "No mintmark"}
                    </CardDescription>
                  </div>
                  <Badge variant={coin.isSold ? "secondary" : "default"} className="ml-2">
                    {coin.isSold ? "Vendu" : "En collection"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Images */}
                <div className="grid grid-cols-2 gap-2">
                  {coin.obverseImageUrl && (
                    <div 
                      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage({ url: coin.obverseImageUrl!, title: `${coin.coinName} - Avers` })}
                    >
                      <img 
                        src={coin.obverseImageUrl} 
                        alt="Avers"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {coin.reverseImageUrl && (
                    <div 
                      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage({ url: coin.reverseImageUrl!, title: `${coin.coinName} - Revers` })}
                    >
                      <img 
                        src={coin.reverseImageUrl} 
                        alt="Revers"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!coin.obverseImageUrl && !coin.reverseImageUrl && (
                    <div className="col-span-2 aspect-square bg-muted rounded-lg flex items-center justify-center">
                      <Eye className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grade</span>
                    <Badge variant="outline">{coin.sheldonGrade}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Métal</span>
                    <span className="font-medium capitalize">{coin.metal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Poids</span>
                    <span className="font-medium">{coin.weight}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix d'achat</span>
                    <span className="font-medium">{spotPriceService.formatCHF(coin.purchasePrice)}</span>
                  </div>
                  {!coin.isSold && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valeur Spot</span>
                        <span className="font-medium">{spotPriceService.formatCHF(bullionValue)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground">P/L Latent</span>
                        <span className={`font-semibold ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {spotPriceService.formatCHF(unrealizedPL)} ({unrealizedPLPercent.toFixed(1)}%)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-4 border-t">
                {!coin.isSold ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => onEditCoin(coin)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => onSellCoin(coin)}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Vendre
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteCoin(coin.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="flex-1 text-center text-sm text-muted-foreground py-2">
                    Pièce vendue
                  </div>
                )}
              </CardFooter>
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