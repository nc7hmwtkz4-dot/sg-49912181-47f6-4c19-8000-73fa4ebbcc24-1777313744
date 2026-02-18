import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, ShoppingCart, Coins, BarChart3, DollarSign } from "lucide-react";
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
                  CHF {stats.bullionValue.toFixed(2)}
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
                  CHF {stats.unrealizedPL.toFixed(2)}
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
                  CHF {stats.totalInvestment.toFixed(2)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Purchase cost</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Listings Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coins Listed</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{listingStats.coinsListed}</div>
                <p className="text-xs text-muted-foreground">Active listings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">CHF {listingStats.totalPurchaseValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Cost of listed coins</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Starting Prices</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">CHF {listingStats.totalListingValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Initial listing prices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Market Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">CHF {listingStats.totalListingValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Highest of starting/bid</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Collection Distribution by Country */}
        {stats.countryDistribution && stats.countryDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Collection Distribution by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.countryDistribution.map((item) => (
                  <div key={item.country}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.country}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} coins ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Collection Distribution by Metal */}
        {stats.metalDistribution && stats.metalDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Collection Distribution by Metal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.metalDistribution.map((item) => (
                  <div key={item.metal}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{item.metal}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} coins ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}