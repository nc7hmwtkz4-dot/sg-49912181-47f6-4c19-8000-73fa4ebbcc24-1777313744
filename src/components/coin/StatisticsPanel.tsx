import { Coin } from "@/types/coin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { spotPriceService } from "@/lib/spotPrices";
import { useEffect, useState } from "react";

interface StatisticsPanelProps {
  coins: Coin[];
}

export function StatisticsPanel({ coins }: StatisticsPanelProps) {
  const [spotPrices, setSpotPrices] = useState<any>(null);

  useEffect(() => {
    const loadSpotPrices = async () => {
      const prices = await spotPriceService.getSpotPrices();
      setSpotPrices(prices);
    };
    loadSpotPrices();
  }, []);

  if (!spotPrices) {
    return null;
  }

  // Calculate statistics
  const unsoldCoins = coins.filter(c => !c.isSold);
  const soldCoins = coins.filter(c => c.isSold);

  // Group by year
  const yearGroups = unsoldCoins.reduce((acc, coin) => {
    const year = coin.year.toString();
    if (!acc[year]) {
      acc[year] = { count: 0, totalCost: 0, totalValue: 0 };
    }
    acc[year].count++;
    acc[year].totalCost += coin.purchasePrice;
    
    if (coin.metal && coin.weight && coin.purity) {
      const value = spotPriceService.calculateBullionValue(
        coin.weight,
        coin.purity,
        coin.metal,
        spotPrices
      );
      acc[year].totalValue += value;
    }
    return acc;
  }, {} as Record<string, { count: number; totalCost: number; totalValue: number }>);

  // Group by grade
  const gradeGroups = unsoldCoins.reduce((acc, coin) => {
    const grade = coin.sheldonGrade;
    if (!acc[grade]) {
      acc[grade] = { count: 0, totalCost: 0, totalValue: 0 };
    }
    acc[grade].count++;
    acc[grade].totalCost += coin.purchasePrice;
    
    if (coin.metal && coin.weight && coin.purity) {
      const value = spotPriceService.calculateBullionValue(
        coin.weight,
        coin.purity,
        coin.metal,
        spotPrices
      );
      acc[grade].totalValue += value;
    }
    return acc;
  }, {} as Record<string, { count: number; totalCost: number; totalValue: number }>);

  const totalCost = unsoldCoins.reduce((sum, c) => sum + c.purchasePrice, 0);
  const totalValue = unsoldCoins.reduce((sum, c) => {
    if (c.metal && c.weight && c.purity) {
      return sum + spotPriceService.calculateBullionValue(
        c.weight,
        c.purity,
        c.metal,
        spotPrices
      );
    }
    return sum;
  }, 0);

  const avgCost = unsoldCoins.length > 0 ? totalCost / unsoldCoins.length : 0;
  const avgValue = unsoldCoins.length > 0 ? totalValue / unsoldCoins.length : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overview Statistics */}
      <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Collection Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Unsold Coins</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{unsoldCoins.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sold Coins</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{soldCoins.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Purchase Price</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {spotPriceService.formatCHF(avgCost)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Bullion Value</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {spotPriceService.formatCHF(avgValue)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Invested</span>
              <span className="font-semibold text-slate-900 dark:text-white">{spotPriceService.formatCHF(totalCost)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Bullion Value</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{spotPriceService.formatCHF(totalValue)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Unrealized P/L</span>
              <span className={`font-semibold ${totalValue - totalCost >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {spotPriceService.formatCHF(totalValue - totalCost)} ({((totalValue - totalCost) / totalCost * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year Distribution */}
      <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Distribution by Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(yearGroups)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([year, stats]) => (
                <div key={year} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{year}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {stats.count} coin{stats.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Cost: {spotPriceService.formatCHF(stats.totalCost)}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Value: {spotPriceService.formatCHF(stats.totalValue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}