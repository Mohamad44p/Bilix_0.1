"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BillingTab = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
          <CardDescription>
            Manage your subscription and payment methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Current Plan</h3>
            <div className="rounded-lg border p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">Pro Plan</h4>
                    <Badge>Current</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    $29/month • Renews on October 1, 2023
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">View Invoice</Button>
                  <Button variant="outline" size="sm">Change Plan</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Payment Methods</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-14 items-center justify-center rounded-md border">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Visa ending in 4242</p>
                    <p className="text-xs text-muted-foreground">
                      Expires 12/2024
                    </p>
                  </div>
                </div>
                <div>
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Remove</Button>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">Add Payment Method</Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Billing History</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">September 1, 2023</p>
                  <p className="text-xs text-muted-foreground">
                    Pro Plan • $29.00
                  </p>
                </div>
                <Button variant="ghost" size="sm">Download</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">August 1, 2023</p>
                  <p className="text-xs text-muted-foreground">
                    Pro Plan • $29.00
                  </p>
                </div>
                <Button variant="ghost" size="sm">Download</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab; 