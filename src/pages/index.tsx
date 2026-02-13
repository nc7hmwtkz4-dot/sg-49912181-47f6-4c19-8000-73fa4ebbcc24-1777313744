import { SEO } from "@/components/SEO";
import { Layout } from "@/components/Layout";
import Link from "next/link";
import { Coins, TrendingUp, Map, BarChart3, Sparkles, Package, LayoutDashboard, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function Home() {
  return (
    <Layout>
      <SEO 
        title="NumiVault - Professional Coin Collection Management"
        description="Manage your numismatic collection with precision. Track inventory, monitor bullion values, and analyze your investments."
      />

      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 relative">
              <Image
                src="/numivault-logo.png"
                alt="NumiVault Logo"
                width={96}
                height={96}
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              NumiVault
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Professional coin collection management with real-time bullion tracking
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/collection">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8">
              <Package className="w-5 h-5 mr-2" />
              View Collection
            </Button>
          </Link>
          
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="border-border hover:bg-accent/10 hover:text-accent text-lg px-8">
              <LayoutDashboard className="w-5 h-5 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-16">
          <Card className="glass-card">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">Real-Time Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Live bullion values updated daily from Metal Price API
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">SKU Management</h3>
              <p className="text-sm text-muted-foreground">
                Organize by country code and KM# with detailed tracking
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground">Profit Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track sales, profits, and margins with detailed insights
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}