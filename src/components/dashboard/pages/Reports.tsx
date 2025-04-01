import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Download,
  FileText,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Reports = () => {
  const savedReports = [
    {
      id: 1,
      name: "Monthly Financial Summary",
      type: "Financial",
      created: "May 10, 2023",
      status: "Ready",
    },
    {
      id: 2,
      name: "Quarterly Tax Report",
      type: "Tax",
      created: "Apr 02, 2023",
      status: "Ready",
    },
    {
      id: 3,
      name: "Annual Revenue Analysis",
      type: "Financial",
      created: "Jan 15, 2023",
      status: "Ready",
    },
    {
      id: 4,
      name: "Vendor Expense Report",
      type: "Expense",
      created: "May 05, 2023",
      status: "Processing",
    },
    {
      id: 5,
      name: "Project Cost Breakdown",
      type: "Project",
      created: "Apr 28, 2023",
      status: "Ready",
    },
  ];

  const scheduledReports = [
    {
      id: 1,
      name: "Weekly Financial Summary",
      schedule: "Every Monday",
      recipients: 3,
      nextRun: "Jun 12, 2023",
    },
    {
      id: 2,
      name: "Monthly Tax Report",
      schedule: "1st of Month",
      recipients: 2,
      nextRun: "Jun 01, 2023",
    },
    {
      id: 3,
      name: "Quarterly Budget Overview",
      schedule: "End of Quarter",
      recipients: 5,
      nextRun: "Jun 30, 2023",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Create, manage, and schedule your reports
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>

        <Tabs defaultValue="saved" className="space-y-4">
          <TabsList>
            <TabsTrigger value="saved">Saved Reports</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search reports..."
                  className="pl-8 w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="tax">Tax</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {savedReports.map((report) => (
                <Card
                  key={report.id}
                  className="shadow-sm hover:shadow transition-shadow"
                >
                  <CardHeader className="py-4 px-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {report.name}
                        </CardTitle>
                        <CardDescription className="flex items-center text-xs">
                          <Calendar className="mr-1 h-3 w-3" /> Created:{" "}
                          {report.created}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          report.status === "Ready" ? "default" : "outline"
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="py-3 px-5 border-t flex items-center justify-between">
                    <Badge variant="outline">{report.type}</Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="mr-2 h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search scheduled reports..."
                  className="pl-8 w-full"
                />
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Schedule
              </Button>
            </div>

            <div className="space-y-3">
              {scheduledReports.map((report) => (
                <Card
                  key={report.id}
                  className="shadow-sm hover:shadow transition-shadow"
                >
                  <CardHeader className="py-4 px-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {report.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs">
                          <RefreshCw className="h-3 w-3" /> {report.schedule}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-primary/10">
                        Next: {report.nextRun}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="py-3 px-5 border-t flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Inbox className="mr-1 h-3.5 w-3.5" />
                      {report.recipients} recipients
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        Pause
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm hover:shadow transition-shadow cursor-pointer">
                <CardContent className="pt-6 px-6 pb-4 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-center">
                    Financial Summary
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Monthly financial overview with charts
                  </p>
                </CardContent>
                <CardFooter className="pb-6 pt-0 px-6 flex justify-center">
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </CardFooter>
              </Card>

              <Card className="shadow-sm hover:shadow transition-shadow cursor-pointer">
                <CardContent className="pt-6 px-6 pb-4 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-center">Tax Report</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Comprehensive tax breakdown
                  </p>
                </CardContent>
                <CardFooter className="pb-6 pt-0 px-6 flex justify-center">
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </CardFooter>
              </Card>

              <Card className="shadow-sm hover:shadow transition-shadow cursor-pointer">
                <CardContent className="pt-6 px-6 pb-4 flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-center">
                    Expense Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Detailed expense categorization
                  </p>
                </CardContent>
                <CardFooter className="pb-6 pt-0 px-6 flex justify-center">
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
