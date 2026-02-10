import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { storageService } from "@/lib/storage";
import { Coin, Sale, COUNTRY_CODES } from "@/types/coin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, TrendingUp, DollarSign, Package, Globe, PieChart } from "lucide-react";

// Metal spot prices (USD per troy ounce) - In production, these would come from an API
const SPOT_PRICES = {
  gold: 2000,
  silver: 25,
  platinum: 950,
  palladium: 1000,
  copper: 0.0035,
  other: 0
};

export default function Dashboard() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
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
  }, []);

  const loadData = () => {
    const loadedCoins = storageService.getCoins();
    const loadedSales = storageService.getSales();
    setCoins(loadedCoins);
    setSales(loadedSales);
    calculateStats(loadedCoins, loadedSales);
  };

  const calculateBullionValue = (coin: Coin): number => {
    const troyOunces = coin.weight / 31.1035; // Convert grams to troy ounces
    const pureMetalOunces = troyOunces * (coin.purity / 100);
    return pureMetalOunces * SPOT_PRICES[coin.metal];
  };

  const calculateStats = (coins: Coin[], sales: Sale[]) => {
    const totalCoins = coins.length;
    const unsoldCoins = coins.filter(c => !c.isSold).length;
    
    const bullionValue = coins
      .filter(c => !c.isSold)
      .reduce((sum, coin) => sum + calculateBullionValue(coin), 0);
    
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

  return (
    <Layout>
      <SEO 
        title="Dashboard - NumiVault"
        description="Analytics and statistics for your coin collection"
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-amber-700 dark:text-amber-400">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete overview of your numismatic portfolio
          </p>
        </div>

        {/* Primary Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Coins
                </CardTitle>
                <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                {stats.totalCoins}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.unsoldCoins} available
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bullion Value
                </CardTitle>
                <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                ${stats.bullionValue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Unsold coins only
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Profit
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                ${stats.totalProfit.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.profitMargin.toFixed(2)}% margin
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sales Revenue
                </CardTitle>
                <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                ${stats.totalSalesAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {sales.length} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-2 border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Purchase Investment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                ${stats.totalPurchaseValue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Total capital invested in collection
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Current Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                ${(stats.bullionValue).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Bullion value of unsold coins
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Realized Gains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${stats.totalProfit.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Profit from completed sales
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Country Distribution */}
          <Card className="border-2 border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Collection by Country
              </CardTitle>
              <CardDescription>Geographic distribution of your coins</CardDescription>
            </CardHeader>
            <CardContent>
              {topCountries.length > 0 ? (
                <div className="space-y-4">
                  {topCountries.map(([code, count]) => (
                    <div key={code} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm font-medium w-12 justify-center">
                          {code}
                        </Badge>
                        <span className="text-sm font-medium">
                          {COUNTRY_CODES[code] || code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-amber-600 h-2 rounded-full"
                            style={{ width: `${(count / stats.totalCoins) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold w-12 text-right">
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
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No coins in collection yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Metal Distribution */}
          <Card className="border-2 border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Collection by Metal
              </CardTitle>
              <CardDescription>Breakdown by precious metal type</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.coinsByMetal).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.coinsByMetal)
                    .sort(([, a], [, b]) => b - a)
                    .map(([metal, count]) => {
                      const colors = {
                        gold: "bg-yellow-500",
                        silver: "bg-gray-400",
                        platinum: "bg-blue-400",
                        palladium: "bg-gray-500",
                        copper: "bg-orange-600",
                        other: "bg-gray-600"
                      };
                      
                      return (
                        <div key={metal} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded ${colors[metal as keyof typeof colors]}`} />
                            <span className="text-sm font-medium capitalize">
                              {metal}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`${colors[metal as keyof typeof colors]} h-2 rounded-full`}
                                style={{ width: `${(count / stats.totalCoins) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold w-12 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No coins in collection yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* World Map Placeholder */}
        <Card className="border-2 border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              World Distribution Map
            </CardTitle>
            <CardDescription>
              Visual representation of your collection across the globe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-8 text-center">
              <Globe className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interactive World Map
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Visualize your collection of {stats.totalCoins} coins across {Object.keys(stats.coinsByCountry).length} countries
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.entries(stats.coinsByCountry).map(([code, count]) => (
                  <Badge key={code} variant="secondary" className="text-xs">
                    {code}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spot Prices Reference */}
        <Card className="border-2 border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="text-sm">Current Spot Prices (Reference)</CardTitle>
            <CardDescription className="text-xs">
              Used for bullion value calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Gold</p>
                <p className="text-sm font-bold text-yellow-600">${SPOT_PRICES.gold}/oz</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Silver</p>
                <p className="text-sm font-bold text-gray-500">${SPOT_PRICES.silver}/oz</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Platinum</p>
                <p className="text-sm font-bold text-blue-600">${SPOT_PRICES.platinum}/oz</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Palladium</p>
                <p className="text-sm font-bold text-gray-600">${SPOT_PRICES.palladium}/oz</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Copper</p>
                <p className="text-sm font-bold text-orange-600">${(SPOT_PRICES.copper * 1000).toFixed(2)}/kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}