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
    bullionValue: 0,
    totalPurchaseValue: 0,
    totalSalesAmount: 0,
    totalProfit: 0,
    profitMargin: 0,
    coinsByCountry: {} as Record<string, number>,
    coinsByMetal: {} as Record<string, number>,
    unsoldCoins: 0
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
    const unsoldCoins = coins.filter(c => !c.isSold).length;
    
    const bullionValue = coins
      .filter(c => !c.isSold)
      .reduce((sum, coin) => sum + calculateBullionValue(coin, prices), 0);
    
    const totalPurchaseValue = coins.reduce((sum, coin) => sum + coin.purchasePrice, 0);
    
    const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
    
    const totalProfit = sales.reduce((sum, sale) => {
      const coin = coins.find(c => c.id === sale.coinId);
      return sum + (sale.salePrice - (coin?.purchasePrice || 0));
    }, 0);
    
    const profitMargin = totalSalesAmount > 0 
      ? ((totalProfit / totalSalesAmount) * 100) 
      : 0;
    
    const coinsByCountry = coins.reduce((acc, coin) => {
      acc[coin.countryCode] = (acc[coin.countryCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const coinsByMetal = coins.reduce((acc, coin) => {
      acc[coin.metal] = (acc[coin.metal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    setStats({
      totalCoins,
      bullionValue,
      totalPurchaseValue,
      totalSalesAmount,
      totalProfit,
      profitMargin,
      coinsByCountry,
      coinsByMetal,
      unsoldCoins
    });
  };

  const topCountries = Object.entries(stats.coinsByCountry)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

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

        {/* Primary Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Coins
                </CardTitle>
                <Package className="w-5 h-5 text-brand-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-brand-primary mb-1">
                {stats.totalCoins}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.unsoldCoins} available
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bullion Value
                </CardTitle>
                <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                {spotPrices ? spotPriceService.formatCHF(stats.bullionValue) : "Loading..."}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Unsold coins only
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Profit
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {spotPriceService.formatCHF(stats.totalProfit)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.profitMargin.toFixed(2)}% margin
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sales Revenue
                </CardTitle>
                <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                {spotPriceService.formatCHF(stats.totalSalesAmount)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sales.length} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-brand-primary" />
                Purchase Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                {spotPriceService.formatCHF(stats.totalPurchaseValue)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Total capital invested in collection
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-brand-primary" />
                Current Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                {spotPrices ? spotPriceService.formatCHF(stats.bullionValue) : "Loading..."}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Bullion value of unsold coins
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-primary" />
                Realized Gains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {spotPriceService.formatCHF(stats.totalProfit)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Profit from completed sales
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Country Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Globe className="w-6 h-6 text-brand-primary" />
                Collection by Country
              </CardTitle>
              <CardDescription className="text-base">Geographic distribution of your coins</CardDescription>
            </CardHeader>
            <CardContent>
              {topCountries.length > 0 ? (
                <div className="space-y-4">
                  {topCountries.map(([code, count]) => (
                    <div key={code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm font-medium w-12 justify-center border-brand-primary text-brand-primary">
                          {code}
                        </Badge>
                        <span className="text-sm font-medium">
                          {COUNTRY_CODES[code] || code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-brand-primary to-brand-secondary h-2.5 rounded-full transition-all"
                            style={{ width: `${(count / stats.totalCoins) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-12 text-right text-brand-primary">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                  {Object.keys(stats.coinsByCountry).length > 5 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                      +{Object.keys(stats.coinsByCountry).length - 5} more countries
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No coins in collection yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metal Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <PieChart className="w-6 h-6 text-brand-primary" />
                Collection by Metal
              </CardTitle>
              <CardDescription className="text-base">Breakdown by precious metal type</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.coinsByMetal).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.coinsByMetal)
                    .sort(([, a], [, b]) => b - a)
                    .map(([metal, count]) => {
                      const colors = {
                        gold: "bg-gradient-to-r from-yellow-500 to-amber-600",
                        silver: "bg-gradient-to-r from-gray-300 to-gray-500",
                        platinum: "bg-gradient-to-r from-blue-400 to-indigo-500",
                        palladium: "bg-gradient-to-r from-gray-400 to-gray-600",
                        copper: "bg-gradient-to-r from-orange-500 to-red-600",
                        other: "bg-gradient-to-r from-gray-500 to-gray-700"
                      };
                      
                      const iconColors = {
                        gold: "text-yellow-600",
                        silver: "text-gray-500",
                        platinum: "text-blue-500",
                        palladium: "text-gray-600",
                        copper: "text-orange-600",
                        other: "text-gray-600"
                      };
                      
                      return (
                        <div key={metal} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Sparkles className={`w-5 h-5 ${iconColors[metal as keyof typeof iconColors]}`} />
                            <span className="text-sm font-medium capitalize">
                              {metal}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className={`${colors[metal as keyof typeof colors]} h-2.5 rounded-full transition-all`}
                                style={{ width: `${(count / stats.totalCoins) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold w-12 text-right text-brand-primary">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No coins in collection yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interactive World Map */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="w-6 h-6 text-brand-primary" />
              World Distribution Map
            </CardTitle>
            <CardDescription className="text-base">
              Interactive visualization of your {stats.totalCoins} coins across {Object.keys(stats.coinsByCountry).length} countries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mapData.length > 0 ? (
              <div className="w-full h-[500px] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-950 rounded-xl p-4 border border-brand-primary/20">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={mapData}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={<CustomTreemapContent />}
                  >
                    <Tooltip 
                      content={({ payload }) => {
                        if (payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                              <p className="font-bold text-brand-primary">{data.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{data.fullName}</p>
                              <p className="text-sm font-semibold mt-1">{data.size} {data.size === 1 ? 'coin' : 'coins'}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-950 rounded-xl p-12 text-center border-2 border-dashed border-brand-primary/30">
                <Globe className="w-20 h-20 mx-auto text-brand-primary mb-4" />
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Collection Data Yet
                </p>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Add coins to your collection to see the interactive world map
                </p>
              </div>
            )}
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