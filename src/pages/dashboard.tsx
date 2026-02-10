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

  const topCountries = stats.countryDistribution.slice(0, 5);

  // Prepare data for treemap
  const mapData = Object.entries(stats.coinsByCountry).map(([code, count]) => ({
    name: code,
    fullName: COUNTRY_CODES[code] || code,
    size: count,
    fill: `hsl(${Math.random() * 360}, 70%, 60%)`
  }));

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, fullName, size } = props;
    
    if (width < 60 || height < 40) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: props.fill,
            stroke: "#fff",
            strokeWidth: 2,
            opacity: 0.9
          }}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          fill="#fff"
          fontSize={width > 80 ? 16 : 12}
          fontWeight="bold"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="#fff"
          fontSize={width > 80 ? 14 : 11}
        >
          {size} {size === 1 ? 'coin' : 'coins'}
        </text>
        {width > 100 && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 28}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
            opacity={0.9}
          >
            {fullName}
          </text>
        )}
      </g>
    );
  };

  return (
    <Layout>
      <SEO 
        title="Dashboard - NumiVault"
        description="Analytics and statistics for your coin collection"
      />

      <div className="space-y-8">
        <div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Complete overview of your numismatic portfolio in Swiss Francs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Coins</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalCoins}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalUnsold} available • {stats.totalSold} sold
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Collection Value</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {spotPriceService.formatCHF(stats.totalBullionValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current bullion value
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Investment</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {spotPriceService.formatCHF(stats.totalCost)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Purchase cost basis
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {spotPriceService.formatCHF(stats.totalProfit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.profitMargin.toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country Distribution */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground">Distribution by Country</CardTitle>
              <CardDescription className="text-muted-foreground">Number of coins per country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.countryDistribution.map(({ country, count, percentage }) => (
                  <div key={country} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{country}</span>
                      <span className="text-muted-foreground">{count} coins ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metal Composition */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground">Metal Composition</CardTitle>
              <CardDescription className="text-muted-foreground">Breakdown by precious metal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.metalDistribution.map(({ metal, count, percentage }) => (
                  <div key={metal} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground capitalize">{metal}</span>
                      <span className="text-muted-foreground">{count} coins ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-secondary to-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* World Map Placeholder */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">Global Collection Map</CardTitle>
            <CardDescription className="text-muted-foreground">Visual representation of coins by country</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center space-y-2">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Interactive world map coming soon</p>
                <p className="text-xs text-muted-foreground">
                  Visualize your collection distribution across {stats.countryDistribution.length} countries
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Swiss Bank Spot Prices */}
        {spotPrices && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-brand-muted to-white dark:from-gray-800 dark:to-gray-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-brand-primary" />
                    Swiss Bank Spot Prices
                  </CardTitle>
                  <CardDescription className="text-base">
                    Current precious metal prices in CHF per gram • Updated: {new Date(spotPrices.lastUpdated).toLocaleString('de-CH')}
                  </CardDescription>
                </div>
                <button
                  onClick={handleForceRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 rounded-xl border border-yellow-200 dark:border-yellow-900">
                  <Sparkles className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gold</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {spotPriceService.formatPricePerGram(spotPrices.gold)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-950 rounded-xl border border-gray-300 dark:border-gray-700">
                  <Sparkles className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Silver</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {spotPriceService.formatPricePerGram(spotPrices.silver)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl border border-blue-200 dark:border-blue-900">
                  <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Platinum</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {spotPriceService.formatPricePerGram(spotPrices.platinum)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-900 rounded-xl border border-gray-400 dark:border-gray-600">
                  <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Palladium</p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {spotPriceService.formatPricePerGram(spotPrices.palladium)}
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