import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, ShoppingCart, BarChart3, Tag, RefreshCw } from "lucide-react";
import { userCoinService } from "@/services/userCoinService";
import { getListingStats } from "@/services/listingService";
import { spotPriceService, type SpotPrices } from "@/lib/spotPrices";

interface Stats {
  totalCoins: number;
  unsoldCoins: number;
  soldCoins: number;
  totalInvestment: number;
  bullionValue: number;
  unrealizedPL: number;
  unrealizedPLPercentage: number;
  countryDistribution: Array<{ country: string; count: number; percentage: number }>;
  metalDistribution: Array<{ metal: string; count: number; percentage: number }>;
}

interface ListingStats {
  coinsListed: number;
  totalPurchaseValue: number;
  totalStartingPrice: number;
  totalListingValue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCoins: 0,
    unsoldCoins: 0,
    soldCoins: 0,
    totalInvestment: 0,
    bullionValue: 0,
    unrealizedPL: 0,
    unrealizedPLPercentage: 0,
    countryDistribution: [],
    metalDistribution: []
  });
  const [listingStats, setListingStats] = useState<ListingStats>({
    coinsListed: 0,
    totalPurchaseValue: 0,
    totalStartingPrice: 0,
    totalListingValue: 0
  });
  const [spotPrices, setSpotPrices] = useState<SpotPrices | null>(null);

  const fetchSpotPrices = async () => {
    const prices = await spotPriceService.getSpotPrices();
    setSpotPrices(prices);
  };

  const loadData = async () => {
    try {
      const [coinsData, listingsData] = await Promise.all([
        userCoinService.getUserCoins(),
        getListingStats()
      ]);

      // Calculate collection stats
      if (coinsData.data) {
        const unsoldCoins = coinsData.data.filter(c => !c.is_sold);
        const soldCoins = coinsData.data.filter(c => c.is_sold);

        // Track country and metal distribution
        const countryCount: Record<string, number> = {};
        const metalCount: Record<string, number> = {};
        
        coinsData.data.forEach(coin => {
          // Count by country
          const country = coin.country_code || "Unknown";
          countryCount[country] = (countryCount[country] || 0) + 1;
          
          // Count by metal
          const metal = coin.coins_reference?.metal || "Unknown";
          metalCount[metal] = (metalCount[metal] || 0) + 1;
        });

        let totalInvestment = 0;
        let bullionValue = 0;

        if (spotPrices) {
          unsoldCoins.forEach(coin => {
            totalInvestment += coin.purchase_price;

            if (coin.coins_reference?.metal && coin.coins_reference?.weight && coin.coins_reference?.purity) {
              const coinBullionValue = spotPriceService.calculateBullionValue(
                coin.coins_reference.weight,
                coin.coins_reference.purity,
                coin.coins_reference.metal,
                spotPrices
              );
              bullionValue += coinBullionValue;
            }
          });
        }

        const unrealizedPL = bullionValue - totalInvestment;
        const unrealizedPLPercentage = totalInvestment > 0 ? (unrealizedPL / totalInvestment) * 100 : 0;

        setStats({
          totalCoins: coinsData.data.length,
          unsoldCoins: unsoldCoins.length,
          soldCoins: soldCoins.length,
          totalInvestment,
          bullionValue,
          unrealizedPL,
          unrealizedPLPercentage,
          countryDistribution: Object.entries(countryCount).map(([country, count]) => ({
            country,
            count,
            percentage: (count / coinsData.data.length) * 100
          })).sort((a, b) => b.count - a.count),
          metalDistribution: Object.entries(metalCount).map(([metal, count]) => ({
            metal,
            count,
            percentage: (count / coinsData.data.length) * 100
          })).sort((a, b) => b.count - a.count)
        });
      }

      // Set listing stats
      if (listingsData.data) {
        setListingStats({
          coinsListed: listingsData.data.totalListings || 0,
          totalPurchaseValue: listingsData.data.totalPurchaseValue || 0,
          totalStartingPrice: listingsData.data.totalStartingPrice || 0,
          totalListingValue: listingsData.data.totalListingValue || 0
        });
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchSpotPrices();
  }, []);

  useEffect(() => {
    if (spotPrices) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotPrices]);

  return (
    <Layout>
      <SEO 
        title="Dashboard - NumiVault"
        description="Overview of your numismatic collection"
      />
      
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-amber-500">Dashboard</h1>
            <p className="text-slate-400 mt-2">Overview of your numismatic collection</p>
          </div>
        </div>

        {/* Collection Overview Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-slate-200">Collection Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Coins</CardTitle>
                <Package className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100">{stats.totalCoins}</div>
                <p className="text-xs text-slate-400 mt-1">
                  Unsold: {stats.unsoldCoins} | Sold: {stats.soldCoins}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Bullion Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100">
                  CHF {stats.bullionValue.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">Unsold coins only</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Unrealized P/L</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stats.unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  CHF {stats.unrealizedPL.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {stats.unrealizedPLPercentage >= 0 ? '+' : ''}{stats.unrealizedPLPercentage.toFixed(2)}% vs cost
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Investment</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100">
                  CHF {stats.totalInvestment.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">Purchase cost</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Spot Prices Section */}
        {spotPrices && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Current Metal Spot Prices</h2>
              <Button onClick={fetchSpotPrices} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Prices
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Gold (Au)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    CHF {spotPrices.gold.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">per gram</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-400/10 border-gray-400/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Silver (Ag)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    CHF {spotPrices.silver.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">per gram</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-500/10 border-slate-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Platinum (Pt)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                    CHF {spotPrices.platinum.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">per gram</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Active Listings Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coins Listed</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{listingStats.coinsListed}</p>
                <p className="text-xs text-muted-foreground">Active listings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Purchase Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  CHF {listingStats.totalPurchaseValue.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Starting Prices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  CHF {listingStats.totalStartingPrice.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Market Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  CHF {listingStats.totalListingValue.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Country Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Country Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.countryDistribution
                  .sort((a, b) => b.count - a.count)
                  .map((country) => {
                    const percentage = stats.totalCoins > 0
                      ? (country.count / stats.totalCoins) * 100
                      : 0;
                    return (
                      <div key={country.country}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {country.country}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {country.count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Metal Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Metal Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-4">
                {/* SVG Pie Chart */}
                <div className="relative w-48 h-48 mb-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {(() => {
                      let accumulatedPercent = 0;
                      return stats.metalDistribution
                        .sort((a, b) => b.count - a.count)
                        .map((metal) => {
                          const percentage = stats.totalCoins > 0
                            ? (metal.count / stats.totalCoins) * 100
                            : 0;
                          
                          if (percentage === 0) return null;

                          // Calculate dash array and offset for the stroke
                          const radius = 40;
                          const circumference = 2 * Math.PI * radius;
                          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                          const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                          
                          accumulatedPercent += percentage;

                          // Metal colors
                          const metalColors: Record<string, string> = {
                            gold: '#EAB308', // yellow-500
                            silver: '#9CA3AF', // gray-400
                            copper: '#EA580C', // orange-600
                            platinum: '#64748B', // slate-500
                            bronze: '#B45309', // amber-700
                            nickel: '#6B7280', // gray-500
                          };

                          return (
                            <circle
                              key={metal.metal}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke={metalColors[metal.metal.toLowerCase()] || '#3B82F6'}
                              strokeWidth="20"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-1000 ease-out hover:opacity-80"
                            />
                          );
                        });
                    })()}
                  </svg>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full">
                  {stats.metalDistribution
                    .sort((a, b) => b.count - a.count)
                    .map((metal) => {
                      const percentage = stats.totalCoins > 0
                        ? (metal.count / stats.totalCoins) * 100
                        : 0;
                      
                      const metalColors: Record<string, string> = {
                        gold: 'bg-yellow-500',
                        silver: 'bg-gray-400',
                        copper: 'bg-orange-600',
                        platinum: 'bg-slate-500',
                        bronze: 'bg-amber-700',
                        nickel: 'bg-gray-500',
                      };

                      return (
                        <div key={metal.metal} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${metalColors[metal.metal.toLowerCase()] || 'bg-primary'}`} />
                          <span className="text-sm font-medium capitalize">{metal.metal}</span>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}