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
  totalBullionValue: number;
  totalInvestment: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
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
    totalBullionValue: 0,
    totalInvestment: 0,
    unrealizedPL: 0,
    unrealizedPLPercent: 0
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

        let totalBullionValue = 0;
        let totalInvestment = 0;

        if (spotPrices) {
          unsoldCoins.forEach(coin => {
            totalInvestment += coin.purchase_price;

            if (coin.metal_content) {
              const metalPrice = spotPrices[coin.metal_content.toLowerCase()];
              if (metalPrice) {
                totalBullionValue += coin.weight * metalPrice;
              }
            }
          });
        }

        const unrealizedPL = totalBullionValue - totalInvestment;
        const unrealizedPLPercent = totalInvestment > 0 ? (unrealizedPL / totalInvestment) * 100 : 0;

        setStats({
          totalCoins: coinsData.data.length,
          unsoldCoins: unsoldCoins.length,
          soldCoins: soldCoins.length,
          totalBullionValue,
          totalInvestment,
          unrealizedPL,
          unrealizedPLPercent
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
      if (listingsData.success) {
        setListingStats({
          coinsListed: listingsData.coinsListed || 0,
          totalPurchaseValue: listingsData.totalPurchaseValue || 0,
          totalListingValue: listingsData.totalListingValue || 0
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
                  CHF {stats.totalBullionValue.toFixed(2)}
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
                  {stats.unrealizedPLPercent >= 0 ? '+' : ''}{stats.unrealizedPLPercent.toFixed(2)}% vs cost
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
          <h2 className="text-2xl font-semibold mb-4 text-slate-200">Active Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Coins Listed</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100">{listingStats.coinsListed}</div>
                <p className="text-xs text-slate-400 mt-1">Active listings</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Purchase Value</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100">
                  CHF {listingStats.totalPurchaseValue.toFixed(2)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Cost of listed coins</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Starting Prices</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100">
                  CHF {listingStats.totalListingValue.toFixed(2)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Initial listing prices</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Current Market Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100">
                  CHF {listingStats.totalListingValue.toFixed(2)}
                </div>
                <p className="text-xs text-slate-400 mt-1">Highest of starting/bid</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sales Performance Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-slate-200">Sales Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  CHF {salesStats.totalProfit.toFixed(2)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Margin: {salesStats.averageMargin.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Coins Sold</CardTitle>
                <Coins className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">{salesStats.salesCount}</div>
                <p className="text-xs text-slate-400 mt-1">Completed sales</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}