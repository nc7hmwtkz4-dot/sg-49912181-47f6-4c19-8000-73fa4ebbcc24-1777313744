import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Loader2, Database, Globe } from "lucide-react";
import { useRouter } from "next/router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface CoinResult {
  id: string;
  numista_id?: number;
  title: string;
  country_code: string;
  year_issued?: number;
  metal: string;
  purity: number;
  weight: number;
  image_obverse_url?: string;
  image_reverse_url?: string;
}

interface SearchResponse {
  source: "local" | "numista" | "none";
  data: CoinResult[];
}

interface CoinSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCoinSelected?: (coin: CoinResult) => void;
}

export function CoinSearchModal({ open, onOpenChange, onCoinSelected }: CoinSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<CoinResult[]>([]);
  const [source, setSource] = useState<"local" | "numista" | "none">("none");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setResults([]);
      setSource("none");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/numista/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de recherche");
      }

      const data: SearchResponse = await response.json();
      setResults(data.data);
      setSource(data.source);

      if (data.source === "numista" && data.data.length > 0) {
        toast({
          title: "Nouvelles pièces importées",
          description: `${data.data.length} pièce(s) ajoutée(s) au catalogue depuis Numista`,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Erreur de recherche",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      setResults([]);
      setSource("none");
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleAddToCollection = async (coin: CoinResult) => {
    if (onCoinSelected) {
      onCoinSelected(coin);
    } else {
      // Default behavior: navigate to collection with the reference_coin_id
      router.push(`/collection?add=${coin.id}`);
    }
    onOpenChange(false);
  };

  const getSourceBadge = () => {
    if (source === "local") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Database className="h-3 w-3" />
          Catalogue local
        </Badge>
      );
    }
    if (source === "numista") {
      return (
        <Badge variant="default" className="gap-1">
          <Globe className="h-3 w-3" />
          Importé depuis Numista
        </Badge>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rechercher une pièce</DialogTitle>
          <DialogDescription>
            Recherchez dans le catalogue global (Numista) pour ajouter une pièce en 1-clic
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ex: 20 francs vreneli, 5 francs léopold..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Source Badge */}
          {searchQuery.length >= 3 && !isSearching && results.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {results.length} résultat{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
              </p>
              {getSourceBadge()}
            </div>
          )}

          {/* Results */}
          <ScrollArea className="h-[400px] pr-4">
            {searchQuery.length < 3 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Entrez au moins 3 caractères pour rechercher
                </p>
              </div>
            )}

            {searchQuery.length >= 3 && !isSearching && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Aucun résultat trouvé pour &quot;{searchQuery}&quot;
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Essayez avec un autre terme de recherche
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((coin) => (
                  <div
                    key={coin.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* Coin Image */}
                    <div className="flex-shrink-0">
                      {coin.image_obverse_url ? (
                        <img
                          src={coin.image_obverse_url}
                          alt={coin.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Coin Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{coin.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {coin.country_code}
                        </Badge>
                        {coin.year_issued && (
                          <span className="text-xs">{coin.year_issued}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{coin.metal}</span>
                        <span>•</span>
                        <span>{coin.weight}g</span>
                        <span>•</span>
                        <span>{(coin.purity * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Add Button */}
                    <Button
                      size="sm"
                      onClick={() => handleAddToCollection(coin)}
                      className="flex-shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Help Text */}
          {searchQuery.length >= 3 && !isSearching && (
            <p className="text-xs text-muted-foreground">
              💡 Les pièces trouvées sur Numista sont automatiquement ajoutées au catalogue pour les prochaines recherches
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}