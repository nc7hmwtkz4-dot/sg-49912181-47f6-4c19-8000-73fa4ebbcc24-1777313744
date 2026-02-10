import { SEO } from "@/components/SEO";
import Link from "next/link";
import { Coins, TrendingUp, Map, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      <SEO 
        title="NumiVault - Professional Coin Collection Management"
        description="Manage your coin collection with SKU tracking, sales records, and comprehensive analytics"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary blur-3xl opacity-20 rounded-full"></div>
              <Coins className="w-20 h-20 text-brand-primary relative z-10" />
            </div>
            <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-brand-primary to-brand-secondary dark:from-white dark:via-brand-primary dark:to-brand-secondary bg-clip-text text-transparent">
              NumiVault
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Professional numismatic collection management with SKU tracking, 
              Swiss bank spot prices, and comprehensive analytics
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/collection">
                <Button size="lg" className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all">
                  <Coins className="mr-2 w-5 h-5" />
                  View Collection
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-2 border-brand-primary text-brand-primary hover:bg-brand-muted">
                  <BarChart3 className="mr-2 w-5 h-5" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-slate-900">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center mb-4">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">SKU Management</CardTitle>
                <CardDescription className="text-base">
                  Organize by country code and KM# with detailed mintage tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-emerald-950">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Sales Tracking</CardTitle>
                <CardDescription className="text-base">
                  Record sales with automatic profit calculations and markup analysis
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">World Map View</CardTitle>
                <CardDescription className="text-base">
                  Visualize your collection distribution across countries
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-orange-950">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">Swiss Spot Prices</CardTitle>
                <CardDescription className="text-base">
                  Real-time bullion values in CHF per gram for accurate portfolio tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-brand-primary to-brand-secondary border-0 shadow-2xl">
            <CardHeader className="text-center text-white">
              <CardTitle className="text-3xl mb-2">Start Building Your Collection</CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Track value, manage sales, and analyze your numismatic portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center text-white">
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <p className="text-5xl font-bold mb-2">0</p>
                  <p className="text-white/80">Total Coins</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <p className="text-5xl font-bold mb-2">CHF 0</p>
                  <p className="text-white/80">Collection Value</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <p className="text-5xl font-bold mb-2">0</p>
                  <p className="text-white/80">Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}