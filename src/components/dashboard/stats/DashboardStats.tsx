import { TrendingUp, ArrowUp, ArrowDown, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats as DashboardStatsType } from "@/lib/actions/dashboard";

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return value.toFixed(1);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <Card className="bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
        <CardHeader className="p-4 pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              <div className="flex items-center mt-1 text-xs">
                <Badge 
                  variant="outline" 
                  className={`gap-1 font-normal ${
                    stats.invoiceChangePercent >= 0 
                      ? "bg-green-500/10 text-green-500 border-green-500/20" 
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {stats.invoiceChangePercent >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  <span>{formatPercentage(Math.abs(stats.invoiceChangePercent))}%</span>
                </Badge>
                <span className="text-muted-foreground ml-1">vs previous period</span>
              </div>
            </div>
            <div className="h-12 w-16 bg-primary/10 flex items-center justify-center rounded-md">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
        <CardHeader className="p-4 pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.outstandingAmount)}</p>
              <div className="flex items-center mt-1 text-xs">
                <Badge 
                  variant="outline" 
                  className={`gap-1 font-normal ${
                    stats.outstandingChangePercent <= 0 
                      ? "bg-green-500/10 text-green-500 border-green-500/20" 
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {stats.outstandingChangePercent <= 0 ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUp className="h-3 w-3" />
                  )}
                  <span>{formatPercentage(Math.abs(stats.outstandingChangePercent))}%</span>
                </Badge>
                <span className="text-muted-foreground ml-1">vs previous period</span>
              </div>
            </div>
            <div className="h-12 w-16 bg-amber-500/10 flex items-center justify-center rounded-md">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
        <CardHeader className="p-4 pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Cash Flow</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.cashFlow)}</p>
              <div className="flex items-center mt-1 text-xs">
                <Badge 
                  variant="outline" 
                  className={`gap-1 font-normal ${
                    stats.cashFlowChangePercent >= 0 
                      ? "bg-green-500/10 text-green-500 border-green-500/20" 
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {stats.cashFlowChangePercent >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  <span>{formatPercentage(Math.abs(stats.cashFlowChangePercent))}%</span>
                </Badge>
                <span className="text-muted-foreground ml-1">vs previous period</span>
              </div>
            </div>
            <div className="h-12 w-16 bg-green-500/10 flex items-center justify-center rounded-md">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 