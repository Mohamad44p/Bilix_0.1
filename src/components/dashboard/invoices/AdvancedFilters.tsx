import { useState, useEffect } from "react";
import { CalendarIcon, Filter, Sparkles, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface AdvancedFiltersProps {
  onFilterChange: (filters: {
    status?: InvoiceStatus;
    category?: string;
    tags?: string[];
    dateRange?: { start: string; end: string };
  }) => void;
  availableCategories: string[];
  availableTags: string[];
  filterSuggestions: Array<{
    category?: string;
    status?: InvoiceStatus;
    tags?: string[];
    dateRange?: { start: string; end: string };
  }>;
  activeFilters: {
    status?: InvoiceStatus;
    category?: string;
    tags?: string[];
    dateRange?: { start: string; end: string };
  };
}

export function AdvancedFilters({
  onFilterChange,
  availableCategories,
  availableTags,
  filterSuggestions,
  activeFilters,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState(activeFilters);
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: activeFilters.dateRange?.start ? new Date(activeFilters.dateRange.start) : undefined,
    to: activeFilters.dateRange?.end ? new Date(activeFilters.dateRange.end) : undefined,
  });

  // Update filters when activeFilters changes
  useEffect(() => {
    setFilters(activeFilters);
    setDateRange({
      from: activeFilters.dateRange?.start ? new Date(activeFilters.dateRange.start) : undefined,
      to: activeFilters.dateRange?.end ? new Date(activeFilters.dateRange.end) : undefined,
    });
  }, [activeFilters]);

  // Update date range in filters
  useEffect(() => {
    if (dateRange.from || dateRange.to) {
      setFilters((prev) => ({
        ...prev,
        dateRange: {
          start: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "",
          end: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : "",
        },
      }));
    } else if (filters.dateRange) {
      setFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.dateRange;
        return newFilters;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // Count of active filters
  const activeFilterCount = Object.keys(filters).reduce((count, key) => {
    if (key === "tags" && Array.isArray(filters.tags) && filters.tags.length > 0) {
      return count + filters.tags.length;
    }
    if (key === "dateRange" && filters.dateRange) {
      return count + 1;
    }
    if (filters[key as keyof typeof filters]) {
      return count + 1;
    }
    return count;
  }, 0);

  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setDateRange({});
    onFilterChange({});
    setIsOpen(false);
  };

  // Remove a specific filter
  const removeFilter = (type: string, value?: string) => {
    if (type === "status") {
      setFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.status;
        return newFilters;
      });
    } else if (type === "category") {
      setFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.category;
        return newFilters;
      });
    } else if (type === "tag" && value) {
      setFilters((prev) => ({
        ...prev,
        tags: prev.tags?.filter((tag) => tag !== value) || [],
      }));
    } else if (type === "dateRange") {
      setFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.dateRange;
        return newFilters;
      });
      setDateRange({});
    }
  };

  // Toggle a tag
  const toggleTag = (tag: string) => {
    setFilters((prev) => {
      const currentTags = prev.tags || [];
      if (currentTags.includes(tag)) {
        return {
          ...prev,
          tags: currentTags.filter((t) => t !== tag),
        };
      } else {
        return {
          ...prev,
          tags: [...currentTags, tag],
        };
      }
    });
  };

  // Apply a suggested filter
  const applySuggestion = (suggestion: {
    category?: string;
    status?: InvoiceStatus;
    tags?: string[];
    dateRange?: { start: string; end: string };
  }) => {
    const newFilters = { ...filters };
    
    if (suggestion.category) {
      newFilters.category = suggestion.category;
    }
    
    if (suggestion.status) {
      newFilters.status = suggestion.status;
    }
    
    if (suggestion.tags && suggestion.tags.length > 0) {
      newFilters.tags = [...(newFilters.tags || []), ...suggestion.tags];
      // Remove duplicates
      newFilters.tags = [...new Set(newFilters.tags)];
    }
    
    if (suggestion.dateRange) {
      newFilters.dateRange = suggestion.dateRange;
      setDateRange({
        from: suggestion.dateRange.start ? new Date(suggestion.dateRange.start) : undefined,
        to: suggestion.dateRange.end ? new Date(suggestion.dateRange.end) : undefined,
      });
    }
    
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 px-3 lg:px-4 relative">
              <Filter className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 min-w-5 px-1 rounded-full text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px] p-0" align="start">
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter Invoices</h4>
                <Button
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={resetFilters}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator />
            <ScrollArea className="h-[320px]">
              <div className="p-4 pt-2 space-y-4">
                {/* Status filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Status
                  </label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: value === "all" ? undefined : (value as InvoiceStatus),
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any status</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Category
                  </label>
                  <Select
                    value={filters.category || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        category: value === "all" ? undefined : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any category</SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          filters.tags?.includes(tag)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Date range filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Date Range
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          "Select date range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="range"
                        selected={dateRange as DateRange}
                        onSelect={(range) => setDateRange(range as { from?: Date; to?: Date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* AI Suggestions */}
                {filterSuggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium mb-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex p-1 rounded-full hover:bg-purple-100/50 cursor-help">
                              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="center" className="bg-slate-900 text-white p-2 text-xs font-medium">
                            AI-powered filter suggestions
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span>Suggested Filters</span>
                    </div>
                    <div className="space-y-1.5">
                      {filterSuggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-sm"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          {suggestion.status && <span>Status: {suggestion.status}</span>}
                          {suggestion.category && <span>Category: {suggestion.category}</span>}
                          {suggestion.tags && suggestion.tags.length > 0 && (
                            <span>Tags: {suggestion.tags.join(", ")}</span>
                          )}
                          {suggestion.dateRange && (
                            <span>
                              Date: {new Date(suggestion.dateRange.start).toLocaleDateString()} - {new Date(suggestion.dateRange.end).toLocaleDateString()}
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={resetFilters}>
                Reset
              </Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Active filters display */}
        {activeFilterCount > 0 && (
          <div className="flex items-center flex-wrap gap-1.5">
            {filters.status && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1"
              >
                Status: {filters.status.toLowerCase()}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => removeFilter("status")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.category && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1"
              >
                Category: {filters.category}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => removeFilter("category")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.tags &&
              filters.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => removeFilter("tag", tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            {filters.dateRange && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1"
              >
                {filters.dateRange.start && filters.dateRange.end
                  ? `${new Date(filters.dateRange.start).toLocaleDateString()} - ${new Date(filters.dateRange.end).toLocaleDateString()}`
                  : filters.dateRange.start
                  ? `From ${new Date(filters.dateRange.start).toLocaleDateString()}`
                  : `Until ${new Date(filters.dateRange.end).toLocaleDateString()}`}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => removeFilter("dateRange")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={resetFilters}
                  >
                    Clear all
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove all filters</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
} 