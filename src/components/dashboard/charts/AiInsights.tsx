"use client";

import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";

const AiInsights = () => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 bg-gradient-to-r from-blue-50 to-blue-50/30 dark:from-blue-950/50 dark:to-blue-950/20">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Revenue Growth</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your June revenue has increased by 18.2% compared to May. This is
              higher than your 12-month average growth of 11.4%.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3 bg-gradient-to-r from-amber-50 to-amber-50/30 dark:from-amber-950/50 dark:to-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Seasonal Trend Detected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Based on historical data, you may experience a 15-20% decline in
              revenue during August. Consider planning for this reduction.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3 bg-gradient-to-r from-green-50 to-green-50/30 dark:from-green-950/50 dark:to-green-950/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Cost Optimization</p>
            <p className="text-sm text-muted-foreground mt-1">
              AI analysis identified potential savings of $2,750/month by
              consolidating subscriptions from multiple vendors.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-3 bg-gradient-to-r from-red-50 to-red-50/30 dark:from-red-950/50 dark:to-red-950/20">
        <div className="flex items-start gap-3">
          <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Invoice Aging</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your average days to payment has increased to 32 days (previously
              28 days). This is affecting your cash flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiInsights;
