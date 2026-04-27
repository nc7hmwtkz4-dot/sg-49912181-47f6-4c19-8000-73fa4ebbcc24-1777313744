import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, DollarSign, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import type { Coin } from "@/types/coin";
import { spotPriceService } from "@/lib/spotPrices";

interface ListViewProps {
  coins: Coin[];
  onEditCoin: (coin: Coin) => void;
  onDeleteCoin: (coinId: string) => void;
  onSellCoin: (coin: Coin) => void;
  calculateBullionValue: (coin: Coin) => number;
}

export function ListView({ coins, onEditCoin, onDeleteCoin, onSellCoin, calculateBullionValue }: ListViewProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">SKU</TableHead>
            <TableHead className="font-semibold">Pièce</TableHead>
            <TableHead className="font-semibold">Année</TableHead>
            <TableHead className="font-semibold">Grade</TableHead>
            <TableHead className="font-semibold">Métal</TableHead>
            <TableHead className="font-semibold text-right">Poids (g)</TableHead>
            <TableHead className="font-semibold text-right">Pureté</TableHead>
            <TableHead className="font-semibold text-right">Prix achat</TableHead>
            <TableHead className="font-semibold text-right">Valeur Spot</TableHead>
            <TableHead className="font-semibold text-right">P/L Latent</TableHead>
            <TableHead className="font-semibold">Statut</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coins.map((coin) => {
            const bullionValue = calculateBullionValue(coin);
            const unrealizedPL = bullionValue - coin.purchasePrice;
            const unrealizedPLPercent = coin.purchasePrice > 0 ? (unrealizedPL / coin.purchasePrice) * 100 : 0;

            return (
              <TableRow key={coin.id} className={coin.isSold ? "opacity-60" : ""}>
                <TableCell className="font-mono text-xs">{coin.sku}</TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="truncate font-medium">{coin.coinName}</div>
                  <div className="text-xs text-muted-foreground">{coin.countryCode}</div>
                </TableCell>
                <TableCell>{coin.year}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {coin.sheldonGrade}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{coin.metal}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{coin.weight.toFixed(3)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{(coin.purity * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{spotPriceService.formatCHF(coin.purchasePrice)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {coin.isSold ? "-" : spotPriceService.formatCHF(bullionValue)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {coin.isSold ? (
                    <span className="text-muted-foreground">-</span>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      {unrealizedPL >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={unrealizedPL >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {spotPriceService.formatCHF(unrealizedPL)}
                      </span>
                      <span className={`text-xs ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({unrealizedPLPercent.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={coin.isSold ? "secondary" : "default"}>
                    {coin.isSold ? "Vendu" : "En collection"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {!coin.isSold ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditCoin(coin)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSellCoin(coin)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <DollarSign className="h-4 w-4" />
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
                      <span className="text-sm text-muted-foreground">Vendu</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}