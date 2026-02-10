import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Coins, LayoutDashboard, Package, TrendingUp } from "lucide-react";
import { ThemeSwitch } from "./ThemeSwitch";
import { Button } from "./ui/button";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                NumiVault
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button 
                  variant={isActive("/dashboard") ? "default" : "ghost"}
                  className={isActive("/dashboard") ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-accent/10 hover:text-accent"}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/collection">
                <Button 
                  variant={isActive("/collection") ? "default" : "ghost"}
                  className={isActive("/collection") ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-accent/10 hover:text-accent"}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Inventory
                </Button>
              </Link>
              <Link href="/sales">
                <Button 
                  variant={isActive("/sales") ? "default" : "ghost"}
                  className={isActive("/sales") ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-accent/10 hover:text-accent"}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Sales
                </Button>
              </Link>
              <ThemeSwitch />
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        {children}
      </main>
      
      <footer className="border-t border-border mt-16 py-6">
        <div className="container">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>© 2026 NumiVault. Professional coin collection management.</p>
            <div className="flex items-center gap-1">
              <span>Powered by</span>
              <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Metal Price API</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}