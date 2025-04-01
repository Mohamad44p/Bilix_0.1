"use client";

import { TrendingUp, Lightbulb, PieChart, Calendar, AlertTriangle } from "lucide-react";

interface AiInsight {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// This is a placeholder component until real AI insights can be generated
export default function AiInsights() {
  // Placeholder insights that would come from a real AI analysis
  const insights: AiInsight[] = [
    {
      id: "insight-1",
      title: "Revenue Trend",
      description: "Your revenue has increased by 23% compared to the previous period. This is mainly due to increased sales in the technology category.",
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />
    },
    {
      id: "insight-2",
      title: "Expense Optimization",
      description: "You could save $1,250 monthly by consolidating your software subscriptions. Several overlapping services were detected.",
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />
    },
    {
      id: "insight-3",
      title: "Category Analysis",
      description: "Marketing expenses represent 32% of your total spending, above the industry average of 24% for your business size.",
      icon: <PieChart className="h-5 w-5 text-purple-500" />
    },
    {
      id: "insight-4",
      title: "Payment Timing",
      description: "Your clients take an average of 37 days to pay invoices, which is 7 days longer than the previous quarter.",
      icon: <Calendar className="h-5 w-5 text-green-500" />
    },
    {
      id: "insight-5",
      title: "Risk Assessment",
      description: "Two clients account for 45% of your revenue, representing a potential cash flow risk if either reduces their business.",
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />
    }
  ];

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <div 
          key={insight.id} 
          className="p-3 rounded-lg border border-border/60 transition-all hover:border-border hover:bg-accent/50"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 bg-muted rounded-md p-1.5 flex-shrink-0">
              {insight.icon}
            </div>
            <div>
              <h4 className="text-sm font-medium">{insight.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
