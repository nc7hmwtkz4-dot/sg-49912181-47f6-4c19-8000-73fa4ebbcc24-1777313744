import React, { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Edit, Trash2, DollarSign, ShoppingCart, Eye } from "lucide-react";
import { spotPriceService } from "@/lib/spotPrices";
import { compareGrades } from "@/lib/gradeHierarchy";
import type { Coin, SheldonGrade } from "@/types/coin";
import type { FilterState } from "./FilterBar";

interface GroupedCoinTableProps {
  coins: Coin[];
  filters: FilterState;
  salesData: Array<{
    coin_id: string;
    sale_price: number;
    sale_date: string;
    buyer_info?: string;
    notes?: string;
  }>;
  sortBy: "year-asc" | "year-desc" | "date-newest" | "date-oldest" | "price-low" | "price-high" | "grade" | "best-to-sell" | "profit";
  onEditCoin: (coin: Coin) => void;
  onDeleteCoin: (coinId: string) => void;
  onRecordSale: (coinId: string) => void;
  onCreateListing: (coin: Coin) => void;
  onViewListing: () => void;
  calculateBullionValue: (coin: Coin) => number;
  onSellCoin?: (coin: Coin) => void;
}

interface YearGroup {
  year: number;
  coins: Coin[];
  gradeGroups: GradeGroup[];
  avgPrice: number;
  expanded: boolean;
}

interface GradeGroup {
  grade: string;
  coins: Coin[];
  avgPrice: number;
  expanded: boolean;
}

export function GroupedCoinTable({
  coins,
  filters,
  salesData,
  sortBy,
  onEditCoin,
  onDeleteCoin,
  onRecordSale,
  onCreateListing,
  onViewListing,
  calculateBullionValue,
  onSellCoin
}: GroupedCoinTableProps) {
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  // Filter coins based on filters
  const filteredCoins = useMemo(() => {
    return coins.filter(coin => {
      // Grade filter
      if (filters.grades.length > 0 && !filters.grades.includes(coin.sheldonGrade)) {
        return false;
      }

      // Status filter
      if (filters.status === "in-collection" && (coin.isSold || coin.listingId)) {
        return false;
      }
      if (filters.status === "sold" && !coin.isSold) {
        return false;
      }
      if (filters.status === "listed" && !coin.listingId) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== "all") {
        const purchaseDate = new Date(coin.purchaseDate);
        const now = new Date();
        
        switch (filters.dateRange) {
          case "last-week": {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (purchaseDate < weekAgo) return false;
            break;
          }
          case "last-month": {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (purchaseDate < monthAgo) return false;
            break;
          }
          case "last-3-months": {
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            if (purchaseDate < threeMonthsAgo) return false;
            break;
          }
          case "custom": {
            if (filters.customDateFrom && purchaseDate < filters.customDateFrom) return false;
            if (filters.customDateTo && purchaseDate > filters.customDateTo) return false;
            break;
          }
        }
      }

      return true;
    });
  }, [coins, filters]);

  // Sort coins before grouping
  const sortedCoins = useMemo(() => {
    const sorted = [...filteredCoins];
    
    switch (sortBy) {
      case "year-asc":
        sorted.sort((a, b) => a.year - b.year);
        break;
      case "year-desc":
        sorted.sort((a, b) => b.year - a.year);
        break;
      case "date-newest":
        sorted.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
        break;
      case "date-oldest":
        sorted.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
        break;
      case "price-low":
        sorted.sort((a, b) => a.purchasePrice - b.purchasePrice);
        break;
      case "price-high":
        sorted.sort((a, b) => b.purchasePrice - a.purchasePrice);
        break;
      case "grade":
        sorted.sort((a, b) => compareGrades(a.sheldonGrade, b.sheldonGrade));
        break;
      case "best-to-sell": {
        sorted.sort((a, b) => {
          const aProfitPotential = !a.isSold && !a.listingId ? calculateBullionValue(a) - a.purchasePrice : -Infinity;
          const bProfitPotential = !b.isSold && !b.listingId ? calculateBullionValue(b) - b.purchasePrice : -Infinity;
          return bProfitPotential - aProfitPotential;
        });
        break;
      }
      case "profit": {
        sorted.sort((a, b) => {
          const aProfit = calculateBullionValue(a) - a.purchasePrice;
          const bProfit = calculateBullionValue(b) - b.purchasePrice;
          return bProfit - aProfit;
        });
        break;
      }
    }
    
    return sorted;
  }, [filteredCoins, sortBy, calculateBullionValue]);

  // Group coins by year and grade
  const yearGroups = useMemo(() => {
    const groups: Record<number, YearGroup> = {};

    sortedCoins.forEach(coin => {
      if (!groups[coin.year]) {
        groups[coin.year] = {
          year: coin.year,
          coins: [],
          gradeGroups: [],
          avgPrice: 0,
          expanded: expandedState[`year-${coin.year}`] !== false // Default expanded
        };
      }
      groups[coin.year].coins.push(coin);
    });

    // Calculate averages and create grade groups
    Object.values(groups).forEach(yearGroup => {
      yearGroup.avgPrice = yearGroup.coins.reduce((sum, c) => sum + c.purchasePrice, 0) / yearGroup.coins.length;

      // Group by grade within year
      const gradeMap: Record<string, GradeGroup> = {};
      yearGroup.coins.forEach(coin => {
        const grade = coin.sheldonGrade || "Unknown";
        if (!gradeMap[grade]) {
          gradeMap[grade] = {
            grade,
            coins: [],
            avgPrice: 0,
            expanded: expandedState[`year-${yearGroup.year}-grade-${grade}`] !== false // Default expanded
          };
        }
        gradeMap[grade].coins.push(coin);
      });

      // Calculate grade averages and sort grades
      yearGroup.gradeGroups = Object.values(gradeMap)
        .map(gradeGroup => ({
          ...gradeGroup,
          avgPrice: gradeGroup.coins.reduce((sum, c) => sum + c.purchasePrice, 0) / gradeGroup.coins.length
        }))
        .sort((a, b) => compareGrades(a.grade as SheldonGrade, b.grade as SheldonGrade));
    });

    return Object.values(groups).sort((a, b) => 
      sortBy.includes("year-desc") ? b.year - a.year : a.year - b.year
    );
  }, [sortedCoins, expandedState, sortBy]);

  const toggleYearGroup = (year: number) => {
    setExpandedState(prev => ({
      ...prev,
      [`year-${year}`]: !prev[`year-${year}`]
    }));
  };

  const toggleGradeGroup = (year: number, grade: string) => {
    setExpandedState(prev => ({
      ...prev,
      [`year-${year}-grade-${grade}`]: !prev[`year-${year}-grade-${grade}`]
    }));
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
            <TableHead className="text-slate-600 dark:text-slate-400 w-12"></TableHead>
            <TableHead className="text-slate-600 dark:text-slate-400">Year</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-400">Mint</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-400">Grade</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-400">Purchase Date</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-400">Purchase Price</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-400">Sale Info</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-400">Notes</TableHead>
            <TableHead className="text-slate-600 dark:text-slate-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {yearGroups.map(yearGroup => (
            <React.Fragment key={yearGroup.year}>
              {/* Year Group Header */}
              <TableRow className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer border-slate-200 dark:border-slate-700">
                <TableCell colSpan={10} onClick={() => toggleYearGroup(yearGroup.year)}>
                  <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    {yearGroup.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>{yearGroup.year}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                      ({yearGroup.coins.length} {yearGroup.coins.length === 1 ? 'coin' : 'coins'})
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                      - Avg: {spotPriceService.formatCHF(yearGroup.avgPrice)}
                    </span>
                  </div>
                </TableCell>
              </TableRow>

              {/* Grade Groups */}
              {yearGroup.expanded && yearGroup.gradeGroups.map(gradeGroup => (
                <React.Fragment key={`${yearGroup.year}-${gradeGroup.grade}`}>
                  {/* Grade Group Header */}
                  <TableRow className="bg-slate-100/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer border-slate-200 dark:border-slate-700">
                    <TableCell></TableCell>
                    <TableCell colSpan={9} onClick={() => toggleGradeGroup(yearGroup.year, gradeGroup.grade)}>
                      <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                        {gradeGroup.expanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        <span>Grade: {gradeGroup.grade}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                          ({gradeGroup.coins.length} {gradeGroup.coins.length === 1 ? 'coin' : 'coins'})
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                          - Avg: {spotPriceService.formatCHF(gradeGroup.avgPrice)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Individual Coins */}
                  {gradeGroup.expanded && gradeGroup.coins.map(coin => {
                    const sale = salesData.find(s => s.coin_id === coin.id);
                    return (
                      <TableRow key={coin.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell></TableCell>
                        <TableCell className="text-slate-900 dark:text-white font-medium">{coin.year}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{coin.mintmark || "-"}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{coin.sheldonGrade || "-"}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {new Date(coin.purchaseDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{spotPriceService.formatCHF(coin.purchasePrice)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={coin.isSold ? "secondary" : coin.listingId ? "outline" : "default"}
                            className={
                              coin.isSold 
                                ? "bg-red-900/50 text-red-200 border-red-800"
                                : coin.listingId
                                ? "bg-blue-900/50 text-blue-200 border-blue-800"
                                : "bg-green-900/50 text-green-200 border-green-800"
                            }
                          >
                            {coin.isSold ? "Sold" : coin.listingId ? "Listed" : "In Collection"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          {sale ? (
                            <div className="text-sm">
                              <div>{spotPriceService.formatCHF(sale.sale_price)}</div>
                              <div className="text-xs text-slate-500">
                                {new Date(sale.sale_date).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                          ) : coin.isSold ? (
                            <div className="text-sm text-slate-500">Sale info unavailable</div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {coin.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {!coin.isSold ? (
                              <>
                                {!coin.listingId ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-slate-600 text-slate-300"
                                      onClick={() => onCreateListing(coin)}
                                    >
                                      <ShoppingCart className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-slate-600 text-slate-300"
                                      onClick={() => onSellCoin ? onSellCoin(coin) : onRecordSale(coin.id)}
                                    >
                                      <DollarSign className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-600 text-blue-300"
                                    onClick={onViewListing}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600 text-slate-300"
                                  onClick={() => onEditCoin(coin)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-600 text-red-300"
                                  onClick={() => onDeleteCoin(coin.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground py-2">
                                Sold
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}