import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Coins, LayoutDashboard, Package, TrendingUp, LogIn, LogOut, User } from "lucide-react";
import { ThemeSwitch } from "./ThemeSwitch";
import { Button } from "./ui/button";
import { AuthModal } from "./AuthModal";
import { authService, AuthUser } from "@/services/authService";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          user_metadata: session.user.user_metadata,
          created_at: session.user.created_at
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await authService.signOut();
    router.push("/");
  };

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
              
              <div className="h-6 w-px bg-border mx-2" />
              
              <ThemeSwitch />
              
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {(user.user_metadata?.full_name?.[0] || user.email[0]).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/collection" className="cursor-pointer">
                        <Coins className="mr-2 h-4 w-4" />
                        <span>My Collection</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setIsAuthModalOpen(true)} variant="outline" className="ml-2 gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              )}
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

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          // Additional logic after successful login if needed
        }}
      />
    </div>
  );
}