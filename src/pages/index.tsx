import { SEO } from "@/components/SEO";
import Link from "next/link";
import { Coins, TrendingUp, Map, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      <SEO 
        title="NumiVault - Professional Coin Collection Management"
        description="Manage your coin collection with SKU tracking, sales records, and comprehensive analytics"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <Coins className="w-16 h-16 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-amber-700 to-orange-600 dark:from-amber-400 dark:to-orange-300 bg-clip-text text-transparent">
              NumiVault
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Professional numismatic collection management system with SKU tracking, sales analytics, and bullion value calculations
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/collection">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Coins className="mr-2 w-5 h-5" />
                  View Collection
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-gray-800">
                  <BarChart3 className="mr-2 w-5 h-5" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="border-2 border-amber-200 dark:border-amber-900 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Coins className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-2" />
                <CardTitle className="text-lg">SKU Management</CardTitle>
                <CardDescription>
                  Organize by country code and KM# with detailed mintage tracking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-amber-200 dark:border-amber-900 hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                <CardTitle className="text-lg">Sales Tracking</CardTitle>
                <CardDescription>
                  Record sales with automatic profit calculations and markup analysis
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-amber-200 dark:border-amber-900 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Map className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="text-lg">World Map View</CardTitle>
                <CardDescription>
                  Visualize your collection distribution across countries
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 border-amber-200 dark:border-amber-900 hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                <CardDescription>
                  Track bullion value, profits, margins, and collection statistics
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Quick Stats Preview */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-gray-800 dark:to-slate-800 border-amber-300 dark:border-amber-700">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Get Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-4xl font-bold text-amber-700 dark:text-amber-400">0</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Total Coins</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-green-700 dark:text-green-400">$0.00</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Collection Value</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">0</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Countries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}