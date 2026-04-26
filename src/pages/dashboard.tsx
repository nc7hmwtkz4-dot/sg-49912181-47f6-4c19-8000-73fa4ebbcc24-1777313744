import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, TrendingUp, ShoppingCart, BarChart3, Tag, RefreshCw, DollarSign } from "lucide-react";
import { userCoinService } from "@/services/userCoinService";
import { getListingStats } from "@/services/listingService";
import { spotPriceService, type SpotPrices } from "@/lib/spotPrices";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell 
} from "recharts";

interface Stats {
  totalCoins: number;
  unsoldCoins: number;
  soldCoins: number;
  totalInvestment: number;
  bullionValue: number;
  unrealizedPL: number;
  unrealizedPLPercentage: number;
  realizedPL: number;
  countryDistribution: Array<{ country: string; count: number; percentage: number }>;
  metalDistribution: Array<{ metal: string; count: number; percentage: number; value: number }>;
}

interface ListingStats {
  coinsListed: number;
  totalPurchaseValue: number;
  totalStartingPrice: number;
  totalListingValue: number;
}

interface TimeSeriesData {
  date: string;
  totalInvested: number;
  bullionValue: number;
}

interface MonthlySalesData {
  month: string;
  sales: number;
  profit: number;
}

const COLORS = {
  gold: "#EAB308",
  silver: "#9CA3AF", 
  copper: "#EA580C",
  platinum: "#64748B",
  bronze: "#B45309",
  nickel: "#6B7280",
  palladium: "#A78BFA",
  other: "#3B82F6"
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalCoins: 0,
    unsoldCoins: 0,
    soldCoins: 0,
    totalInvestment: 0,
    bullionValue: 0,
    unrealizedPL: 0,
    unrealizedPLPercentage: 0,
    realizedPL: 0,
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
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([]);

  const fetchSpotPrices = async () => {
    const prices = await spotPriceService.getSpotPrices();
    setSpotPrices(prices);
  };

  const loadData = async () => {
    try {
      const [coinsData, listingsData, salesData] = await Promise.all([
        userCoinService.getUserCoins(),
        getListingStats(),
        supabase
          .from("user_sales")
          .select("*, user_coins!inner(purchase_price, purchase_date)")
          .order("sale_date", { ascending: true })
      ]);

      // Calculate realized P/L from sales
      let realizedPL = 0;
      if (salesData.data) {
        realizedPL = salesData.data.reduce((sum, sale) => sum + (sale.net_profit || 0), 0);
      }

      // Calculate collection stats
      if (coinsData.data) {
        const unsoldCoins = coinsData.data.filter(c => !c.is_sold);
        const soldCoins = coinsData.data.filter(c => c.is_sold);

        // Track country and metal distribution
        const countryCount: Record<string, number> = {};
        const metalCount: Record<string, { count: number; value: number }> = {};
        
        let totalInvestment = 0;
        let bullionValue = 0;

        if (spotPrices) {
          unsoldCoins.forEach(coin => {
            totalInvestment += coin.purchase_price;

            // Count by country
            const country = coin.country_code || "Unknown";
            countryCount[country] = (countryCount[country] || 0) + 1;
            
            // Count by metal and calculate value
            const metal = coin.coins_reference?.metal || "other";
            if (!metalCount[metal]) {
              metalCount[metal] = { count: 0, value: 0 };
            }
            metalCount[metal].count += 1;

            if (coin.coins_reference?.metal && coin.coins_reference?.weight && coin.coins_reference?.purity) {
              const coinBullionValue = spotPriceService.calculateBullionValue(
                coin.coins_reference.weight,
                coin.coins_reference.purity,
                coin.coins_reference.metal,
                spotPrices
              );
              bullionValue += coinBullionValue;
              metalCount[metal].value += coinBullionValue;
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
          realizedPL,
          countryDistribution: Object.entries(countryCount).map(([country, count]) => ({
            country,
            count,
            percentage: (count / coinsData.data.length) * 100
          })).sort((a, b) => b.count - a.count),
          metalDistribution: Object.entries(metalCount).map(([metal, data]) => ({
            metal,
            count: data.count,
            percentage: (data.count / coinsData.data.length) * 100,
            value: data.value
          })).sort((a, b) => b.count - a.count)
        });

        // Generate time series data for evolution chart
        generateTimeSeriesData(unsoldCoins, spotPrices);
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

      // Generate monthly sales data
      if (salesData.data) {
        generateMonthlySalesData(salesData.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const generateTimeSeriesData = (coins: any[], prices: SpotPrices | null) => {
    if (!coins.length || !prices) return;

    // Group by purchase date and calculate cumulative values
    const dateMap: Record<string, { invested: number; value: number }> = {};
    
    coins.forEach(coin => {
      const date = coin.purchase_date || new Date().toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { invested: 0, value: 0 };
      }
      dateMap[date].invested += coin.purchase_price;
      
      if (coin.coins_reference?.metal && coin.coins_reference?.weight && coin.coins_reference?.purity) {
        const coinValue = spotPriceService.calculateBullionValue(
          coin.coins_reference.weight,
          coin.coins_reference.purity,
          coin.coins_reference.metal,
          prices
        );
        dateMap[date].value += coinValue;
      }
    });

    // Convert to cumulative time series
    const sortedDates = Object.keys(dateMap).sort();
    let cumulativeInvested = 0;
    let cumulativeValue = 0;
    
    const series: TimeSeriesData[] = sortedDates.map(date => {
      cumulativeInvested += dateMap[date].invested;
      cumulativeValue += dateMap[date].value;
      return {
        date: new Date(date).toLocaleDateString('fr-CH', { month: 'short', year: 'numeric' }),
        totalInvested: Math.round(cumulativeInvested),
        bullionValue: Math.round(cumulativeValue)
      };
    });

    setTimeSeriesData(series);
  };

  const generateMonthlySalesData = (sales: any[]) => {
    const monthMap: Record<string, { sales: number; profit: number }> = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.sale_date);
      const monthKey = date.toLocaleDateString('fr-CH', { month: 'short', year: 'numeric' });
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { sales: 0, profit: 0 };
      }
      monthMap[monthKey].sales += sale.sale_price || 0;
      monthMap[monthKey].profit += sale.net_profit || 0;
    });

    const monthlyData: MonthlySalesData[] = Object.entries(monthMap).map(([month, data]) => ({
      month,
      sales: Math.round(data.sales),
      profit: Math.round(data.profit)
    }));

    setMonthlySalesData(monthlyData);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                <CardTitle className="text-sm font-medium text-slate-400">Realized P/L</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stats.realizedPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  CHF {stats.realizedPL.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 mt-1">From sold coins</p>
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

        {/* Value Evolution Chart */}
        {timeSeriesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la Valeur</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `CHF ${value.toLocaleString('de-CH')}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalInvested" 
                    stroke="#F59E0B" 
                    name="Total Investi"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bullionValue" 
                    stroke="#3B82F6" 
                    name="Valeur Métal"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
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
          {/* Metal Distribution - Recharts Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Métal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.metalDistribution}
                    dataKey="count"
                    nameKey="metal"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) => `${entry.metal} (${Math.round(entry.percentage)}%)`}
                  >
                    {stats.metalDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.metal.toLowerCase() as keyof typeof COLORS] || COLORS.other} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} pièces (CHF ${props.payload.value.toLocaleString('de-CH')})`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Country Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Country Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.countryDistribution
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
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
        </div>

        {/* Monthly Sales Chart */}
        {monthlySalesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ventes Mensuelles</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `CHF ${value.toLocaleString('de-CH')}`}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#3B82F6" name="Ventes" />
                  <Bar dataKey="profit" fill="#10B981" name="Profit Net" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}