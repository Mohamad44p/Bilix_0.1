
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Download, Info, Shield, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const Subscription = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription and billing</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>You are currently on the Pro plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge className="bg-primary mr-2">Pro</Badge>
                  <span className="text-sm text-muted-foreground">$29/month</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">Active</Badge>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Document Credits</span>
                  <span className="text-sm text-muted-foreground">250/500 used</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">AI Assistant Credits</span>
                  <span className="text-sm text-muted-foreground">125/300 used</span>
                </div>
                <Progress value={42} className="h-2" />
              </div>
              
              <div className="rounded-lg bg-muted p-3">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium mb-1">Next billing period starts on June 15, 2023</p>
                    <p className="text-muted-foreground">Your card ending in 4242 will be charged $29.00</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-5">
              <Button variant="outline">Cancel Plan</Button>
              <Button>Upgrade Plan</Button>
            </CardFooter>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-14 bg-slate-800 rounded flex items-center justify-center mr-3">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Visa ending in 4242</div>
                    <div className="text-xs text-muted-foreground">Expires 12/2024</div>
                  </div>
                </div>
                <Badge variant="outline">Default</Badge>
              </div>
              
              <Button variant="outline" className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Add New Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">Available Plans</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="shadow-sm relative border-muted">
                <CardHeader>
                  <CardTitle>Basic</CardTitle>
                  <CardDescription>For individuals getting started</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">$9<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                    <Button variant="outline" className="w-full">Start with Basic</Button>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>100 invoice uploads/month</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Basic OCR extraction</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Basic reporting</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>1 team member</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm relative border-primary overflow-hidden">
                <div className="absolute top-0 right-0">
                  <div className="bg-primary text-xs text-primary-foreground py-1 px-3 rounded-bl-lg">
                    Current
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Pro</CardTitle>
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  </div>
                  <CardDescription>For growing businesses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">$29<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                    <Button className="w-full">Current Plan</Button>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>500 invoice uploads/month</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Advanced OCR with AI</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Custom reports & scheduling</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>5 team members</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>AI insights & predictions</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Email integrations</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm relative border-muted">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CardTitle>Enterprise</CardTitle>
                    <Shield className="h-4 w-4 text-blue-500" />
                  </div>
                  <CardDescription>For large organizations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                    <Button variant="outline" className="w-full">Contact Sales</Button>
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Unlimited invoice uploads</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Premium OCR with custom fields</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Advanced analytics & reporting</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Unlimited team members</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Advanced integrations (API)</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Dedicated support</span>
                    </div>
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span>Custom AI training</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="billing" className="space-y-4">
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Download
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="hover:bg-muted/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium">INV-8765</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                          May 15, 2023
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          $29.00
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">Paid</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium">INV-7654</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                          Apr 15, 2023
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          $29.00
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">Paid</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium">INV-6543</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                          Mar 15, 2023
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          $29.00
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">Paid</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;