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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      <nav className="border-b border-amber-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-amber-700 dark:text-amber-400">
              <Coins className="w-6 h-6" />
              NumiVault
            </Link>

            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button 
                  variant={isActive("/dashboard") ? "default" : "ghost"}
                  className={isActive("/dashboard") ? "bg-amber-600 hover:bg-amber-700" : ""}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/collection">
                <Button 
                  variant={isActive("/collection") ? "default" : "ghost"}
                  className={isActive("/collection") ? "bg-amber-600 hover:bg-amber-700" : ""}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Collection
                </Button>
              </Link>
              <Link href="/sales">
                <Button 
                  variant={isActive("/sales") ? "default" : "ghost"}
                  className={isActive("/sales") ? "bg-amber-600 hover:bg-amber-700" : ""}
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

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}