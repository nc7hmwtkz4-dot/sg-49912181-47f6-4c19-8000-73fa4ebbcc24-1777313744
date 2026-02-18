import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, ShoppingCart, Coins, BarChart3, DollarSign, Activity, ShoppingBag, Tag, RefreshCw } from "lucide-react";
import { userCoinService } from "@/services/userCoinService";
import { userSalesService } from "@/services/userSalesService";
import { getListingStats } from "@/services/listingService";
import { spotPriceService } from "@/lib/spotPrices";

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

interface SalesStats {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
  salesCount: number;
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
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageMargin: 0,
    salesCount: 0
  });
  const [listingStats, setListingStats] = useState<ListingStats>({
    coinsListed: 0,
    totalPurchaseValue: 0,
    totalStartingPrice: 0,
    totalListingValue: 0
  });
  const [spotPrices, setSpotPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSpotPrices = async () => {
    const prices = await spotPriceService.getSpotPrices();
    setSpotPrices(prices);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [coinsData, salesData, listingsData] = await Promise.all([
        userCoinService.getUserCoins(),
        userSalesService.getUserSales(),
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
          const metal = coin.metal || "Unknown";
          metalCount[metal] = (metalCount[metal] || 0) + 1;
        });

        let totalInvestment = 0;
        let bullionValue = 0;

        if (spotPrices) {
          unsoldCoins.forEach(coin => {
            totalInvestment += coin.purchase_price;

            if (coin.metal) {
              const metalPrice = spotPrices[coin.metal.toLowerCase()];
              if (metalPrice && coin.weight) {
                bullionValue += coin.weight * metalPrice;
              }
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

      // Calculate sales stats - EXACT COPY FROM SALES PAGE
      if (salesData.data) {
        const mappedSales = salesData.data.map((s: any) => ({
          salePrice: s.sale_price,
          purchasePrice: s.purchase_price
        }));

        const totalRevenue = mappedSales.reduce((sum: number, sale: any) => sum + sale.salePrice, 0);
        const totalCost = mappedSales.reduce((sum: number, sale: any) => sum + sale.purchasePrice, 0);
        const totalProfit = mappedSales.reduce((sum: number, sale: any) => sum + (sale.salePrice - sale.purchasePrice), 0);
        const averageMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

        console.log("Dashboard Sales Calculation:", {
          totalRevenue,
          totalCost,
          totalProfit,
          averageMargin,
          salesCount: salesData.data.length
        });

        setSalesStats({
          totalRevenue,
          totalCost,
          totalProfit,
          averageMargin,
          salesCount: salesData.data.length
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpotPrices();
  }, []);

  useEffect(() => {
    if (spotPrices) {
      loadData();
    }
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
          <button
            onClick={fetchSpotPrices}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            Refresh Prices
          </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <Card className="bg-orange-500/10 border-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Copper (Cu)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    CHF {spotPrices.copper.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <Card>
            <CardHeader>
              <CardTitle>Collection Distribution by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.countryDistribution.map((item) => (
                  <div key={item.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{item.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collection Distribution by Metal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                {stats.metalDistribution.length > 0 && (
                  <>
                    <svg viewBox="0 0 200 200" className="w-48 h-48">
                      {(() => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                        let currentAngle = -90;
                        
                        return stats.metalDistribution.map((item, index) => {
                          const percentage = item.percentage;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle * (Math.PI / 180);
                          const endAngle = (currentAngle + angle) * (Math.PI / 180);
                          
                          const x1 = 100 + 80 * Math.cos(startAngle);
                          const y1 = 100 + 80 * Math.sin(startAngle);
                          const x2 = 100 + 80 * Math.cos(endAngle);
                          const y2 = 100 + 80 * Math.sin(endAngle);
                          
                          const largeArc = angle > 180 ? 1 : 0;
                          const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
                          
                          currentAngle += angle;
                          
                          return (
                            <path
                              key={item.metal}
                              d={path}
                              fill={colors[index % colors.length]}
                              stroke="rgb(15, 23, 42)"
                              strokeWidth="1"
                            />
                          );
                        });
                      })()}
                    </svg>
                    
                    <div className="mt-6 space-y-2 w-full">
                      {stats.metalDistribution.map((item, index) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                        return (
                          <div key={item.metal} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              <span className="text-sm">{item.metal}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.count}</span>
                              <span className="text-xs text-muted-foreground">
                                ({item.percentage.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}