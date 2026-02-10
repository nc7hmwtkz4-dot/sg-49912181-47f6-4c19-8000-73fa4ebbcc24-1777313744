import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { storageService } from "@/lib/storage";
import { spotPriceService, SpotPrices } from "@/lib/spotPrices";
import { Coin, Sale, COUNTRY_CODES } from "@/types/coin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, DollarSign, Package, Globe, PieChart, Sparkles, RefreshCw } from "lucide-react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

export default function Dashboard() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCoins: 0,
    totalUnsold: 0,
    totalSold: 0,
    totalBullionValue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    countryDistribution: [] as { country: string; count: number; percentage: number }[],
    metalDistribution: [] as { metal: string; count: number; percentage: number }[]
  });

  useEffect(() => {
    loadData();
    loadSpotPrices();
  }, []);

  const loadData = () => {
    const loadedCoins = storageService.getCoins();
    const loadedSales = storageService.getSales();
    setCoins(loadedCoins);
    setSales(loadedSales);
  };

  const loadSpotPrices = async (forceRefresh = false) => {
    setIsRefreshing(true);
    const prices = await spotPriceService.getSpotPrices(forceRefresh);
    setSpotPrices(prices);
    console.log("Loaded spot prices:", prices);
    // Recalculate stats when spot prices are loaded
    if (coins.length > 0) {
      calculateStats(coins, sales, prices);
    }
    setIsRefreshing(false);
  };

  const handleForceRefresh = async () => {
    await loadSpotPrices(true);
  };

  useEffect(() => {
    if (spotPrices) {
      calculateStats(coins, sales, spotPrices);
    }
  }, [coins, sales, spotPrices]);

  const calculateBullionValue = (coin: Coin, prices: SpotPrices): number => {
    const value = spotPriceService.calculateBullionValue(
      coin.metal,
      coin.weight,
      coin.purity,
      prices
    );
    console.log(`Bullion value for ${coin.sku}:`, {
      metal: coin.metal,
      weight: coin.weight,
      purity: coin.purity,
      spotPrice: prices[coin.metal.toLowerCase() as keyof SpotPrices],
      calculatedValue: value
    });
    return value;
  };

  const calculateStats = (coins: Coin[], sales: Sale[], prices: SpotPrices) => {
    const totalCoins = coins.length;
    const unsoldCoins = coins.filter(c => !c.isSold);
    const totalUnsold = unsoldCoins.length;
    const totalSold = coins.filter(c => c.isSold).length;
    
    const totalBullionValue = unsoldCoins.reduce((sum, coin) => sum + calculateBullionValue(coin, prices), 0);
    
    const totalCost = coins.reduce((sum, coin) => sum + coin.purchasePrice, 0);
    
    const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
    
    const totalProfit = sales.reduce((sum, sale) => {
      const coin = coins.find(c => c.id === sale.coinId);
      return sum + (sale.salePrice - (coin?.purchasePrice || 0));
    }, 0);
    
    const profitMargin = totalSalesAmount > 0 
      ? ((totalProfit / totalSalesAmount) * 100) 
      : 0;
    
    // Calculate distributions
    const coinsByCountry = coins.reduce((acc, coin) => {
      acc[coin.countryCode] = (acc[coin.countryCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const countryDistribution = Object.entries(coinsByCountry)
      .map(([code, count]) => ({
        country: COUNTRY_CODES[code] || code,
        count,
        percentage: (count / totalCoins) * 100
      }))
      .sort((a, b) => b.count - a.count);
    
    const coinsByMetal = coins.reduce((acc, coin) => {
      acc[coin.metal] = (acc[coin.metal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const metalDistribution = Object.entries(coinsByMetal)
      .map(([metal, count]) => ({
        metal,
        count,
        percentage: (count / totalCoins) * 100
      }))
      .sort((a, b) => b.count - a.count);

    setStats({
      totalCoins,
      totalUnsold,
      totalSold,
      totalBullionValue,
      totalCost,
      totalProfit,
      profitMargin,
      countryDistribution,
      metalDistribution
    });
  };

  return (
    <Layout>
      <SEO 
        title="Dashboard - NumiVault"
        description="Analytics and statistics for your coin collection"
      />
    </Layout>
  );
}