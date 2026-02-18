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
import { Coins, TrendingUp, DollarSign, Package, Globe, PieChart, Sparkles, RefreshCw, ShoppingCart, BarChart3 } from "lucide-react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

export default function Dashboard() {
  const [coins, setCoins] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [spotPrices, setSpotPrices] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalCoins: 0,
    unsoldCoins: 0,
    soldCoins: 0,
    totalBullionValue: 0,
    totalInvestment: 0,
    totalProfit: 0,
    profitMargin: 0,
    unrealizedPL: 0,
    unrealizedPLPercent: 0,
    countryDistribution: {} as Record<string, number>,
    metalComposition: {} as Record<string, number>
  });
  
  const [listingStats, setListingStats] = useState({
    coinsListed: 0,
    totalPurchaseValue: 0,
    totalListingValue: 0
  });

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      
      const [coinsResult, salesResult, listingsResult] = await Promise.all([
        userCoinService.getUserCoins(),
        userSalesService.getUserSales(),
        getActiveListings()
      ]);
      
      const prices = await spotPriceService.getSpotPrices();
      
      if (coinsResult.data) setCoins(coinsResult.data);
      if (salesResult.data) setSales(salesResult.data);
      if (listingsResult.data) setListings(listingsResult.data);
      setSpotPrices(prices);
      setIsLoading(false);
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    if (coins.length > 0 && spotPrices) {
      calculateStats(coins, sales, spotPrices);
    }
    if (listings.length >= 0) {
      calculateListingStats(listings);
    }
  }, [coins, sales, spotPrices, listings]);

  const calculateStats = (coinsData: any[], salesData: any[], prices: any) => {
    const unsoldCoins = coinsData.filter(c => !c.is_sold);
    const soldCoins = coinsData.filter(c => c.is_sold);
    
    const totalBullionValue = unsoldCoins.reduce((sum, coin) => {
      return sum + spotPriceService.calculateBullionValue(
        coin.metal,
        coin.weight,
        coin.purity,
        prices
      );
    }, 0);
    
    const totalInvestment = unsoldCoins.reduce((sum, coin) => sum + (coin.purchase_price || 0), 0);
    
    // Calculate total profit using the EXACT data from user_sales table
    // The profit column is already calculated by the database trigger
    const totalProfit = salesData.reduce((sum, sale) => {
      return sum + (sale.profit || 0);
    }, 0);
    
    const unrealizedPL = totalBullionValue - totalInvestment;
    const unrealizedPLPercent = totalInvestment > 0 ? (unrealizedPL / totalInvestment) * 100 : 0;
    
    // Calculate profit margin based on total sales investment
    const totalSalesInvestment = salesData.reduce((sum, sale) => sum + (sale.purchase_price || 0), 0);
    const profitMargin = totalSalesInvestment > 0 ? (totalProfit / totalSalesInvestment) * 100 : 0;
    
    const countryDistribution: Record<string, number> = {};
    coinsData.forEach(coin => {
      const country = coin.country_code || 'Unknown';
      countryDistribution[country] = (countryDistribution[country] || 0) + 1;
    });
    
    const metalComposition: Record<string, number> = {};
    coinsData.forEach(coin => {
      const metal = coin.metal || 'unknown';
      metalComposition[metal] = (metalComposition[metal] || 0) + 1;
    });
    
    setStats({
      totalCoins: coinsData.length,
      unsoldCoins: unsoldCoins.length,
      soldCoins: soldCoins.length,
      totalBullionValue,
      totalInvestment,
      totalProfit,
      profitMargin,
      unrealizedPL,
      unrealizedPLPercent,
      countryDistribution,
      metalComposition
    });
  };

  const calculateListingStats = (listingsData: any[]) => {
    const coinsListed = listingsData.length;
    
    const totalPurchaseValue = listingsData.reduce((sum, listing) => {
      const coinData = listing.coin;
      return sum + (coinData?.purchasePrice || 0);
    }, 0);
    
    const totalListingValue = listingsData.reduce((sum, listing) => {
      const highestPrice = Math.max(listing.starting_price || 0, listing.current_bid || 0);
      return sum + highestPrice;
    }, 0);
    
    setListingStats({
      coinsListed,
      totalPurchaseValue,
      totalListingValue
    });
  };

  const loadSpotPrices = async (forceRefresh = false) => {
    setIsRefreshing(true);
    const prices = await spotPriceService.getSpotPrices(forceRefresh);
    setSpotPrices(prices);
    if (coins.length > 0) {
      calculateStats(coins, sales, prices);
    }
    setIsRefreshing(false);
  };

  const handleForceRefresh = async () => {
    await loadSpotPrices(true);
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

        {/* Collection Overview Section */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Collection Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Total Coins
                </CardTitle>
                <Package className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalCoins}</div>
                <p className="text-xs text-slate-500 mt-1">
                  Unsold: {stats.unsoldCoins} | Sold: {stats.soldCoins}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Bullion Value
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white whitespace-nowrap">
                  {spotPriceService.formatCHF(stats.totalBullionValue)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Unsold coins only</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Unrealized P/L
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold whitespace-nowrap ${stats.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {spotPriceService.formatCHF(stats.unrealizedPL)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.unrealizedPLPercent >= 0 ? '+' : ''}{stats.unrealizedPLPercent.toFixed(1)}% vs cost
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Total Investment
                </CardTitle>
                <ShoppingCart className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white whitespace-nowrap">
                  {spotPriceService.formatCHF(stats.totalInvestment)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Purchase cost</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Listings Section */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Active Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Coins Listed
                </CardTitle>
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{listingStats.coinsListed}</div>
                <p className="text-xs text-slate-500 mt-1">Active listings</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Purchase Value</CardTitle>
                <ShoppingCart className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white whitespace-nowrap">
                  {spotPriceService.formatCHF(listingStats.totalPurchaseValue)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Cost of listed coins</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Starting Prices</CardTitle>
                <DollarSign className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white whitespace-nowrap">
                  {spotPriceService.formatCHF(listingStats.totalListingValue)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Initial listing prices</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Current Market Value</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white whitespace-nowrap">
                  {spotPriceService.formatCHF(listingStats.totalListingValue)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Highest of starting/bid</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sales Performance Section */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Sales Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Total Profit
                </CardTitle>
                <DollarSign className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold whitespace-nowrap ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {spotPriceService.formatCHF(stats.totalProfit)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Margin: {stats.profitMargin.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Coins Sold
                </CardTitle>
                <Coins className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.soldCoins}</div>
                <p className="text-xs text-slate-500 mt-1">Completed sales</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Statistics Grid - Country & Metal Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-500" />
                Country Distribution
              </CardTitle>
              <p className="text-slate-400 text-sm">Top 5 countries in your collection</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.countryDistribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([country, count]) => {
                  const percentage = stats.totalCoins > 0 ? ((count / stats.totalCoins) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={country} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">{country}</span>
                        <span className="text-slate-400">{count} coins ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Metal Composition
              </CardTitle>
              <p className="text-slate-400 text-sm">Breakdown by metal type</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.metalComposition)
                .sort(([, a], [, b]) => b - a)
                .map(([metal, count]) => {
                  const percentage = stats.totalCoins > 0 ? ((count / stats.totalCoins) * 100).toFixed(1) : '0.0';
                  const metalColors: Record<string, string> = {
                    gold: 'from-yellow-500 to-amber-500',
                    silver: 'from-slate-400 to-slate-500',
                    copper: 'from-orange-600 to-red-600',
                    platinum: 'from-slate-300 to-slate-400',
                    palladium: 'from-slate-500 to-slate-600',
                    other: 'from-gray-500 to-gray-600'
                  };
                  return (
                    <div key={metal} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300 capitalize">{metal}</span>
                        <span className="text-slate-400">{count} coins ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${metalColors[metal] || metalColors.other} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
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