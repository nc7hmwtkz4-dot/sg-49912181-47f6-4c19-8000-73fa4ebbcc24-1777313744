import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { userSalesService } from "@/services/userSalesService";
import type { Buyer } from "@/types/coin";
import { Users, DollarSign, ShoppingBag, TrendingUp, Eye, Mail, Phone, MapPin } from "lucide-react";

interface BuyerAnalytics {
  buyer: Buyer;
  totalPurchases: number;
  totalSpent: number;
  averagePurchase: number;
  lastPurchaseDate: string;
  purchases: Array<{
    id: string;
    saleDate: string;
    salePrice: number;
    sku: string;
    coinName: string;
    denomination?: string;
    country?: string;
  }>;
  topPurchases: Array<{
    coinName: string;
    count: number;
  }>;
  preferredDenominations: Array<{
    denomination: string;
    count: number;
  }>;
  preferredCountries: Array<{
    country: string;
    count: number;
  }>;
}

export default function BuyersPage() {
  const [loading, setLoading] = useState(true);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<BuyerAnalytics[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerAnalytics | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const [buyersResult, salesResult] = await Promise.all([
      userSalesService.getBuyers(),
      userSalesService.getUserSales()
    ]);

    let mappedBuyers: Buyer[] = [];
    if (buyersResult.data) {
      mappedBuyers = buyersResult.data.map((b: any) => ({
        id: b.id,
        firstName: b.first_name,
        lastName: b.last_name,
        email: b.email,
        phone: b.phone || undefined,
        address: b.address || undefined,
        postcode: b.postcode || undefined,
        city: b.city || undefined,
        createdAt: b.created_at
      }));
      setBuyers(mappedBuyers);
    }

    if (salesResult.data) {
      setSales(salesResult.data);
      calculateAnalytics(mappedBuyers, salesResult.data);
    }

    setLoading(false);
  };

  const calculateAnalytics = (buyersData: Buyer[], salesData: any[]) => {
    const analyticsMap = new Map<string, BuyerAnalytics>();

    // Initialize analytics for each buyer
    buyersData.forEach(buyer => {
      analyticsMap.set(buyer.id, {
        buyer,
        totalPurchases: 0,
        totalSpent: 0,
        averagePurchase: 0,
        lastPurchaseDate: "",
        purchases: [],
        topPurchases: [],
        preferredDenominations: [],
        preferredCountries: []
      });
    });

    // Process sales data
    salesData.forEach(sale => {
      if (sale.buyer_id && analyticsMap.has(sale.buyer_id)) {
        const analytics = analyticsMap.get(sale.buyer_id)!;
        
        analytics.totalPurchases += 1;
        analytics.totalSpent += Number(sale.sale_price) || 0;
        
        analytics.purchases.push({
          id: sale.id,
          saleDate: sale.sale_date,
          salePrice: sale.sale_price,
          sku: sale.sku,
          coinName: sale.coin_name || "Unknown Coin",
          denomination: sale.denomination,
          country: sale.country
        });

        // Update last purchase date
        if (!analytics.lastPurchaseDate || sale.sale_date > analytics.lastPurchaseDate) {
          analytics.lastPurchaseDate = sale.sale_date;
        }
      }
    });

    // Calculate derived analytics
    analyticsMap.forEach(analytics => {
      // Average purchase
      if (analytics.totalPurchases > 0) {
        analytics.averagePurchase = analytics.totalSpent / analytics.totalPurchases;
      }

      // Sort purchases by date (most recent first)
      analytics.purchases.sort((a, b) => b.saleDate.localeCompare(a.saleDate));

      // Top purchases (by coin name frequency)
      const coinCounts = new Map<string, number>();
      analytics.purchases.forEach(p => {
        coinCounts.set(p.coinName, (coinCounts.get(p.coinName) || 0) + 1);
      });
      analytics.topPurchases = Array.from(coinCounts.entries())
        .map(([coinName, count]) => ({ coinName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Preferred denominations
      const denomCounts = new Map<string, number>();
      analytics.purchases.forEach(p => {
        if (p.denomination) {
          denomCounts.set(p.denomination, (denomCounts.get(p.denomination) || 0) + 1);
        }
      });
      analytics.preferredDenominations = Array.from(denomCounts.entries())
        .map(([denomination, count]) => ({ denomination, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Preferred countries
      const countryCounts = new Map<string, number>();
      analytics.purchases.forEach(p => {
        if (p.country) {
          countryCounts.set(p.country, (countryCounts.get(p.country) || 0) + 1);
        }
      });
      analytics.preferredCountries = Array.from(countryCounts.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    });

    // Convert to array and sort by total spent
    const analyticsArray = Array.from(analyticsMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent);

    setAnalytics(analyticsArray);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "CHF"
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-CH", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const totalRevenue = analytics.reduce((sum, a) => sum + a.totalSpent, 0);
  const totalTransactions = analytics.reduce((sum, a) => sum + a.totalPurchases, 0);
  const activeBuyers = analytics.filter(a => a.totalPurchases > 0).length;

  return (
    <Layout>
      <SEO 
        title="Buyers Analytics - NumiVault"
        description="Analyze your buyers' purchasing patterns and preferences"
      />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Buyers Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Understand your buyers&apos; preferences and purchasing patterns
            </p>
          </div>
        </div>

        {/* Overview Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Buyers</CardTitle>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{buyers.length}</div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                {activeBuyers} active buyers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-green-600/70 dark:text-green-400/70">
                From all buyers
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Transactions</CardTitle>
              <ShoppingBag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalTransactions}</div>
              <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                Completed sales
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950 dark:to-fuchsia-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg. Transaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(totalTransactions > 0 ? totalRevenue / totalTransactions : 0)}
              </div>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                Per transaction
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Buyers Analytics Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Buyer Performance</CardTitle>
            <CardDescription>
              Detailed analytics for each buyer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : analytics.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Buyer Data Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Link buyers to your sales to see analytics
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Buyer Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Purchases</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Avg. Purchase</TableHead>
                      <TableHead>Last Purchase</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.map((buyerAnalytics) => (
                      <TableRow key={buyerAnalytics.buyer.id} className="hover:bg-brand-muted/30">
                        <TableCell className="font-medium">
                          {buyerAnalytics.buyer.firstName} {buyerAnalytics.buyer.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            {buyerAnalytics.buyer.email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[180px]">{buyerAnalytics.buyer.email}</span>
                              </div>
                            )}
                            {buyerAnalytics.buyer.phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{buyerAnalytics.buyer.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-brand-muted text-brand-primary border-brand-primary/20">
                            {buyerAnalytics.totalPurchases}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-brand-primary">
                          {formatCurrency(buyerAnalytics.totalSpent)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(buyerAnalytics.averagePurchase)}
                        </TableCell>
                        <TableCell>
                          {buyerAnalytics.lastPurchaseDate ? (
                            <span className="text-sm">
                              {formatDate(buyerAnalytics.lastPurchaseDate)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBuyer(buyerAnalytics);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Buyer Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-brand-primary">
              {selectedBuyer?.buyer.firstName} {selectedBuyer?.buyer.lastName}
            </DialogTitle>
            <DialogDescription>
              Detailed purchasing history and preferences
            </DialogDescription>
          </DialogHeader>

          {selectedBuyer && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="bg-gradient-to-br from-brand-muted/30 to-transparent border-brand-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedBuyer.buyer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-brand-primary" />
                      <span>{selectedBuyer.buyer.email}</span>
                    </div>
                  )}
                  {selectedBuyer.buyer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-brand-primary" />
                      <span>{selectedBuyer.buyer.phone}</span>
                    </div>
                  )}
                  {(selectedBuyer.buyer.address || selectedBuyer.buyer.city || selectedBuyer.buyer.postcode) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-brand-primary mt-0.5" />
                      <div>
                        {selectedBuyer.buyer.address && <div>{selectedBuyer.buyer.address}</div>}
                        {(selectedBuyer.buyer.city || selectedBuyer.buyer.postcode) && (
                          <div>
                            {selectedBuyer.buyer.postcode} {selectedBuyer.buyer.city}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Purchase Statistics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedBuyer.totalSpent)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Purchases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedBuyer.totalPurchases}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Avg. Purchase</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(selectedBuyer.averagePurchase)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preferences */}
              <div className="grid gap-4 md:grid-cols-3">
                {selectedBuyer.topPurchases.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Most Purchased Coins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedBuyer.topPurchases.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="truncate flex-1 mr-2">{item.coinName}</span>
                            <Badge variant="outline" className="bg-brand-muted">{item.count}x</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedBuyer.preferredDenominations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Preferred Denominations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedBuyer.preferredDenominations.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span>{item.denomination}</span>
                            <Badge variant="outline" className="bg-brand-muted">{item.count}x</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedBuyer.preferredCountries.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Preferred Countries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedBuyer.preferredCountries.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span>{item.country}</span>
                            <Badge variant="outline" className="bg-brand-muted">{item.count}x</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Purchase History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Purchase History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Coin</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBuyer.purchases.map((purchase) => (
                          <TableRow key={purchase.id} className="hover:bg-brand-muted/30">
                            <TableCell>{formatDate(purchase.saleDate)}</TableCell>
                            <TableCell className="font-medium">
                              {purchase.coinName}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-gray-500">
                              {purchase.sku}
                            </TableCell>
                            <TableCell className="text-right font-medium text-brand-primary">
                              {formatCurrency(purchase.salePrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}