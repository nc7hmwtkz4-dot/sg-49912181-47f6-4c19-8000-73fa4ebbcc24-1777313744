import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { userCoinService } from "@/services/userCoinService";
import { userSalesService } from "@/services/userSalesService";
import { getActiveListings } from "@/services/listingService";
import { spotPriceService, SpotPrices } from "@/lib/spotPrices";
import { Coin, Sale, COUNTRY_CODES } from "@/types/coin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, DollarSign, Package, Globe, PieChart, Sparkles, RefreshCw } from "lucide-react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

export default function Dashboard() {
  const [coins, setCoins] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [spotPrices, setSpotPrices] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCoins: 0,
    totalUnsold: 0,
    totalSold: 0,
    totalBullionValue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    unrealizedProfitLoss: 0,
    unrealizedProfitLossPercentage: 0,
    countryDistribution: [] as { country: string; count: number; percentage: number }[],
    metalDistribution: [] as { metal: string; count: number; percentage: number }[]
  });

  useEffect(() => {
    async function loadDashboardData() {
      const [coinsResult, salesResult, listingsResult, prices] = await Promise.all([
        userCoinService.getUserCoins(),
        userSalesService.getUserSales(),
        getActiveListings(),
        spotPriceService.getSpotPrices()
      ]);

      if (coinsResult.data) setCoins(coinsResult.data);
      if (salesResult.data) setSales(salesResult.data);
      if (listingsResult.data) setListings(listingsResult.data);
      setSpotPrices(prices);
      setIsLoading(false);
    }

    loadDashboardData();
  }, []);

  const loadData = async () => {
    const { data: coinsData } = await userCoinService.getUserCoins();
    const { data: salesData } = await userSalesService.getUserSales();
    
    if (coinsData) {
      const mappedCoins: Coin[] = coinsData.map((c: any) => ({
        id: c.id,
        sku: c.sku,
        coinName: c.coin_name,
        countryCode: c.country_code,
        kmNumber: c.km_number,
        year: c.year,
        mintmark: c.mintmark,
        metal: c.metal,
        purity: c.purity,
        weight: c.weight,
        sheldonGrade: c.sheldon_grade,
        purchasePrice: c.purchase_price,
        purchaseDate: c.purchase_date,
        notes: c.notes,
        obverseImageUrl: c.obverse_image_url,
        reverseImageUrl: c.reverse_image_url,
        isSold: c.is_sold
      }));
      setCoins(mappedCoins);
    }

    if (salesData) {
      const mappedSales: Sale[] = salesData.map((s: any) => ({
        id: s.id,
        coinId: s.coin_id,
        saleDate: s.sale_date,
        salePrice: s.sale_price,
        buyerInfo: s.buyer_info,
        notes: s.notes,
        sku: s.sku || "",
        coinName: s.coin_name || "",
        purchasePrice: s.purchase_price || 0,
        profit: s.profit || 0
      }));
      setSales(mappedSales);
    }
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
    
    // Calculate unrealized profit/loss for unsold coins (current bullion value - purchase price)
    const unsoldCost = unsoldCoins.reduce((sum, coin) => sum + coin.purchasePrice, 0);
    const unrealizedProfitLoss = totalBullionValue - unsoldCost;
    const unrealizedProfitLossPercentage = unsoldCost > 0 
      ? ((unrealizedProfitLoss / unsoldCost) * 100) 
      : 0;
    
    const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
    
    const totalProfit = sales.reduce((sum, sale) => {
      const coin = coins.find(c => c.id === sale.coinId);
      return sum + (sale.salePrice - (coin?.purchasePrice || 0));
    }, 0);
    
    const profitMargin = totalSalesAmount > 0 
      ? ((totalProfit / totalSalesAmount) * 100) 
      : 0;
    
    // Calculate distributions - ONLY UNSOLD COINS
    const coinsByCountry = unsoldCoins.reduce((acc, coin) => {
      acc[coin.countryCode] = (acc[coin.countryCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const countryDistribution = Object.entries(coinsByCountry)
      .map(([code, count]) => ({
        country: COUNTRY_CODES[code] || code,
        count,
        percentage: totalUnsold > 0 ? (count / totalUnsold) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
    
    const coinsByMetal = unsoldCoins.reduce((acc, coin) => {
      acc[coin.metal] = (acc[coin.metal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const metalDistribution = Object.entries(coinsByMetal)
      .map(([metal, count]) => ({
        metal,
        count,
        percentage: totalUnsold > 0 ? (count / totalUnsold) * 100 : 0
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
      unrealizedProfitLoss,
      unrealizedProfitLossPercentage,
      countryDistribution,
      metalDistribution
    });
  };

  const refreshStats = () => {
    // Legacy function removed, using calculateStats via useEffect
  };

  return (
    <Layout>
      <SEO 
        title="Dashboard - NumiVault"
        description="Analytics and statistics for your coin collection"
      />

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Overview of your numismatic collection
            </p>
          </div>
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Prices
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Total Coins */}
          <Card className="glass-card hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Coins</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.totalCoins}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Unsold: {stats.totalUnsold}</span>
                    <span>Sold: {stats.totalSold}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bullion Value */}
          <Card className="glass-card hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bullion Value</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats.totalBullionValue.toFixed(2)} CHF
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Unsold coins only</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unrealized P/L */}
          <Card className="glass-card hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unrealized P/L</p>
                  <p className={`text-3xl font-bold mt-1 ${stats.unrealizedProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stats.unrealizedProfitLoss >= 0 ? '+' : ''}{stats.unrealizedProfitLoss.toFixed(2)} CHF
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.unrealizedProfitLossPercentage >= 0 ? '+' : ''}{stats.unrealizedProfitLossPercentage.toFixed(1)}% vs cost
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.unrealizedProfitLoss >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <TrendingUp className={`w-6 h-6 ${stats.unrealizedProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Investment */}
          <Card className="glass-card hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Investment</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats.totalCost.toFixed(2)} CHF
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Purchase cost</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Profit */}
          <Card className="glass-card hover-lift">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className={`text-3xl font-bold mt-1 ${stats.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)} CHF
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Margin: {stats.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Listings Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Active Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Coins Listed</CardDescription>
                <CardTitle className="text-3xl text-white">{listings.length}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Purchase Value</CardDescription>
                <CardTitle className="text-3xl text-white">
                  {spotPriceService.formatCHF(
                    listings.reduce((sum, listing) => sum + (listing.coin?.purchasePrice || 0), 0)
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Starting Prices</CardDescription>
                <CardTitle className="text-3xl text-white">
                  {spotPriceService.formatCHF(
                    listings.reduce((sum, listing) => sum + (listing.starting_price || 0), 0)
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardDescription className="text-slate-400">Current Market Value</CardDescription>
                <CardTitle className="text-3xl text-white">
                  {spotPriceService.formatCHF(
                    listings.reduce((sum, listing) => {
                      const highestPrice = Math.max(listing.starting_price || 0, listing.current_bid || 0);
                      return sum + highestPrice;
                    }, 0)
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Globe className="w-5 h-5 text-primary" />
                Country Distribution
              </CardTitle>
              <CardDescription>Top 5 countries in your collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.countryDistribution.slice(0, 5).map((item, index) => (
                  <div key={item.country} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.country}</span>
                      <span className="text-muted-foreground">
                        {item.count} coins ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-primary' :
                          index === 1 ? 'bg-secondary' :
                          index === 2 ? 'bg-accent' :
                          'bg-muted-foreground'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                {stats.countryDistribution.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No coins in collection yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metal Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <PieChart className="w-5 h-5 text-secondary" />
                Metal Composition
              </CardTitle>
              <CardDescription>Breakdown by metal type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.metalDistribution.map((item, index) => (
                  <div key={item.metal} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground capitalize">{item.metal}</span>
                      <span className="text-muted-foreground">
                        {item.count} coins ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.metal === 'gold' ? 'gradient-gold' :
                          item.metal === 'silver' ? 'gradient-silver' :
                          item.metal === 'platinum' ? 'bg-gradient-to-r from-slate-300 to-slate-500' :
                          'bg-gradient-to-r from-gray-400 to-gray-600'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
                {stats.metalDistribution.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No coins in collection yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spot Prices Info */}
        {spotPrices && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="w-5 h-5 text-accent" />
                Current Spot Prices (CHF per gram)
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(spotPrices.timestamp * 1000).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-muted-foreground">Gold</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {spotPrices.gold.toFixed(2)} CHF
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/10">
                  <p className="text-sm text-muted-foreground">Silver</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {spotPrices.silver.toFixed(2)} CHF
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                  <p className="text-sm text-muted-foreground">Platinum</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {spotPrices.platinum.toFixed(2)} CHF
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">Palladium</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {spotPrices.palladium.toFixed(2)} CHF
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}