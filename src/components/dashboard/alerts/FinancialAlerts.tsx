import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinancialAlert } from "@/lib/actions/dashboard";
import Link from "next/link";

interface FinancialAlertsProps {
  alerts: FinancialAlert[];
}

export default function FinancialAlerts({ alerts }: FinancialAlertsProps) {
  // Color mapping for alert types
  const getAlertColors = (type: FinancialAlert["type"]) => {
    switch (type) {
      case "danger":
        return "bg-red-500/10 border-red-500/20 hover:bg-red-500/15 text-red-500";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15 text-amber-500";
      case "info":
      default:
        return "bg-primary/10 border-primary/20 hover:bg-primary/15 text-primary";
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-sm transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
          Financial Alerts
        </CardTitle>
        <CardDescription>Issues requiring your attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <div 
              key={index} 
              className={`rounded-lg p-4 border transition-all ${getAlertColors(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  alert.type === "danger" ? "text-red-500" : 
                  alert.type === "warning" ? "text-amber-500" : 
                  "text-primary"
                }`} />
                <div>
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.description}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className={`h-auto p-0 mt-1 ${
                      alert.type === "danger" ? "text-red-500" : 
                      alert.type === "warning" ? "text-amber-500" : 
                      "text-primary"
                    }`}
                    asChild
                  >
                    <Link href={alert.actionLink}>
                      {alert.actionText}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-32 border border-dashed rounded-lg text-muted-foreground">
            <p>No alerts at this time</p>
          </div>
        )}
      </CardContent>
      {alerts.length > 0 && (
        <div className="p-4 mt-auto border-t border-border/50">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/dashboard/alerts">
              View all alerts
            </Link>
          </Button>
        </div>
      )}
    </Card>
  );
} 