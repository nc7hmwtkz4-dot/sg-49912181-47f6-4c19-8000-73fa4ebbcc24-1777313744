import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, X, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SheldonGrade } from "@/types/coin";
import { SHELDON_GRADES } from "@/types/coin";

export interface FilterState {
  grades: SheldonGrade[];
  status: "all" | "in-collection" | "sold" | "listed";
  dateRange: "all" | "last-week" | "last-month" | "last-3-months" | "custom";
  customDateFrom?: Date;
  customDateTo?: Date;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function FilterBar({ filters, onFiltersChange, onReset }: FilterBarProps) {
  const [gradePopoverOpen, setGradePopoverOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const toggleGrade = (grade: SheldonGrade) => {
    const newGrades = filters.grades.includes(grade)
      ? filters.grades.filter(g => g !== grade)
      : [...filters.grades, grade];
    onFiltersChange({ ...filters, grades: newGrades });
  };

  const removeGrade = (grade: SheldonGrade) => {
    onFiltersChange({ ...filters, grades: filters.grades.filter(g => g !== grade) });
  };

  const getDateRangeLabel = () => {
    switch (filters.dateRange) {
      case "last-week": return "Last Week";
      case "last-month": return "Last Month";
      case "last-3-months": return "Last 3 Months";
      case "custom": 
        if (filters.customDateFrom && filters.customDateTo) {
          return `${filters.customDateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${filters.customDateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
        return "Custom Range";
      default: return "All Time";
    }
  };

  const hasActiveFilters = filters.grades.length > 0 || filters.status !== "all" || filters.dateRange !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Grade Filter */}
        <Popover open={gradePopoverOpen} onOpenChange={setGradePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 min-w-[180px] justify-between"
            >
              <span className="truncate">
                {filters.grades.length === 0 ? "All Grades" : `${filters.grades.length} Selected`}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" align="start">
            <Command className="bg-white dark:bg-slate-900">
              <CommandInput placeholder="Search grades..." className="border-0" />
              <CommandEmpty>No grade found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {SHELDON_GRADES.map((grade) => (
                  <CommandItem
                    key={grade}
                    onSelect={() => toggleGrade(grade)}
                    className="cursor-pointer"
                  >
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-slate-300 dark:border-slate-700",
                      filters.grades.includes(grade) ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : ""
                    )}>
                      {filters.grades.includes(grade) && <Check className="h-3 w-3" />}
                    </div>
                    <span>{grade}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value: FilterState["status"]) => onFiltersChange({ ...filters, status: value })}>
          <SelectTrigger className="w-[180px] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in-collection">In Collection</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="listed">Listed</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 min-w-[180px] justify-between"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">{getDateRangeLabel()}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700" align="start">
            <div className="p-3 space-y-2">
              <Button
                variant={filters.dateRange === "all" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onFiltersChange({ ...filters, dateRange: "all", customDateFrom: undefined, customDateTo: undefined });
                  setDatePopoverOpen(false);
                }}
              >
                All Time
              </Button>
              <Button
                variant={filters.dateRange === "last-week" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onFiltersChange({ ...filters, dateRange: "last-week", customDateFrom: undefined, customDateTo: undefined });
                  setDatePopoverOpen(false);
                }}
              >
                Last Week
              </Button>
              <Button
                variant={filters.dateRange === "last-month" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onFiltersChange({ ...filters, dateRange: "last-month", customDateFrom: undefined, customDateTo: undefined });
                  setDatePopoverOpen(false);
                }}
              >
                Last Month
              </Button>
              <Button
                variant={filters.dateRange === "last-3-months" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onFiltersChange({ ...filters, dateRange: "last-3-months", customDateFrom: undefined, customDateTo: undefined });
                  setDatePopoverOpen(false);
                }}
              >
                Last 3 Months
              </Button>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Custom Range</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">From:</p>
                    <Calendar
                      mode="single"
                      selected={filters.customDateFrom}
                      onSelect={(date) => {
                        onFiltersChange({ 
                          ...filters, 
                          dateRange: "custom", 
                          customDateFrom: date 
                        });
                      }}
                      className="rounded-md border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">To:</p>
                    <Calendar
                      mode="single"
                      selected={filters.customDateTo}
                      onSelect={(date) => {
                        onFiltersChange({ 
                          ...filters, 
                          dateRange: "custom", 
                          customDateTo: date 
                        });
                        if (date && filters.customDateFrom) {
                          setDatePopoverOpen(false);
                        }
                      }}
                      disabled={(date) => filters.customDateFrom ? date < filters.customDateFrom : false}
                      className="rounded-md border border-slate-300 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Selected Grade Badges */}
      {filters.grades.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.grades.map(grade => (
            <Badge
              key={grade}
              variant="secondary"
              className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
              onClick={() => removeGrade(grade)}
            >
              {grade}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}