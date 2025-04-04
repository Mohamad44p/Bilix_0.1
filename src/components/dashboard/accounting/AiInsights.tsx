"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FraudDetectionResult = {
  id: string;
  invoiceId: string;
  vendorName: string;
  amount: number;
  date: Date;
  issueType: "duplicate" | "anomaly" | "suspicious_vendor" | "price_discrepancy";
  severity: "low" | "medium" | "high";
  description: string;
  confidence: number;
  suggestedAction: string;
};

export type FinancialRisk = {
  id: string;
  category: string;
  description: string;
  impact: "low" | "medium" | "high";
  probability: "low" | "medium" | "high";
  mitigation: string;
};

export type TaxLiability = {
  id: string;
  taxType: string;
  amount: number;
  dueDate: Date;
  status: "upcoming" | "overdue" | "paid";
  description: string;
};

export type AiInsightsData = {
  fraudDetection: {
    results: FraudDetectionResult[];
    lastUpdated: Date;
    totalIssuesFound: number;
    potentialSavings: number;
  };
  financialRisks: {
    risks: FinancialRisk[];
    overallRiskLevel: "low" | "medium" | "high";
    recommendations: string[];
  };
  taxLiabilities: {
    liabilities: TaxLiability[];
    totalDue: number;
    nextDueDate: Date;
    recommendations: string[];
  };
  aiSummary: string;
};

interface AiInsightsProps {
  data: AiInsightsData;
}

const AiInsights = ({ data }: AiInsightsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const getSeverityColor = (level: "low" | "medium" | "high") => {
    return {
      low: "text-green-600 bg-green-50",
      medium: "text-amber-600 bg-amber-50",
      high: "text-red-600 bg-red-50"
    }[level];
  };
  
  const getTaxStatusColor = (status: "upcoming" | "overdue" | "paid") => {
    return {
      upcoming: "text-amber-600 bg-amber-50",
      overdue: "text-red-600 bg-red-50",
      paid: "text-green-600 bg-green-50"
    }[status];
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Financial Insights</CardTitle>
            <CardDescription>
              AI-powered analysis of your financial data
              <span className="text-xs ml-2 text-muted-foreground">
                Last updated: {data.fraudDetection.lastUpdated.toLocaleString()}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
            <TabsTrigger value="risks">Financial Risks</TabsTrigger>
            <TabsTrigger value="tax">Tax Liabilities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-4">
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-2">AI Summary</h3>
              <p className="text-sm whitespace-pre-line">{data.aiSummary}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Fraud Detection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{data.fraudDetection.totalIssuesFound}</div>
                    <Badge variant="outline" className={getSeverityColor(
                      data.fraudDetection.totalIssuesFound === 0 ? "low" : 
                      data.fraudDetection.totalIssuesFound > 5 ? "high" : "medium"
                    )}>
                      {data.fraudDetection.totalIssuesFound === 0 ? "No Issues" : 
                       data.fraudDetection.totalIssuesFound > 5 ? "High Risk" : "Medium Risk"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Potential savings: {formatCurrency(data.fraudDetection.potentialSavings)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Financial Risk Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold capitalize">{data.financialRisks.overallRiskLevel}</div>
                    <Badge variant="outline" className={getSeverityColor(data.financialRisks.overallRiskLevel)}>
                      {data.financialRisks.risks.length} Risk{data.financialRisks.risks.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.financialRisks.recommendations.length} recommendation{data.financialRisks.recommendations.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tax Liabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{formatCurrency(data.taxLiabilities.totalDue)}</div>
                    <Badge variant="outline" className={
                      data.taxLiabilities.liabilities.some(l => l.status === "overdue") 
                        ? "text-red-600 bg-red-50" 
                        : "text-amber-600 bg-amber-50"
                    }>
                      {data.taxLiabilities.liabilities.some(l => l.status === "overdue") 
                        ? "Overdue" 
                        : "Upcoming"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Next due: {data.taxLiabilities.nextDueDate.toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="fraud" className="space-y-4">
            {data.fraudDetection.results.length === 0 ? (
              <div className="rounded-md border p-8 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <h3 className="text-lg font-medium">No Fraud Issues Detected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your invoices have been analyzed and no suspicious activity was found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Potential Issues Detected</h3>
                    <Badge variant="outline" className="text-amber-600 bg-amber-50">
                      Potential Savings: {formatCurrency(data.fraudDetection.potentialSavings)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {data.fraudDetection.results.map((result) => (
                      <div key={result.id} className="rounded-md border p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center">
                              <AlertTriangle className={`h-4 w-4 mr-2 ${
                                result.severity === "high" ? "text-red-600" : 
                                result.severity === "medium" ? "text-amber-600" : "text-green-600"
                              }`} />
                              <h4 className="font-medium">
                                {result.issueType === "duplicate" ? "Duplicate Invoice" :
                                 result.issueType === "anomaly" ? "Anomalous Transaction" :
                                 result.issueType === "suspicious_vendor" ? "Suspicious Vendor" : "Price Discrepancy"}
                              </h4>
                            </div>
                            <p className="text-sm mt-1">{result.description}</p>
                          </div>
                          <Badge variant="outline" className={getSeverityColor(result.severity)}>
                            {result.severity.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="mt-2 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                          <div>
                            <span className="text-muted-foreground">Vendor:</span> {result.vendorName}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount:</span> {formatCurrency(result.amount)}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date:</span> {result.date.toLocaleDateString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence:</span> {result.confidence}%
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Suggested Action:</span> {result.suggestedAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="risks" className="space-y-4">
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Financial Risk Assessment</h3>
                <Badge variant="outline" className={getSeverityColor(data.financialRisks.overallRiskLevel)}>
                  {data.financialRisks.overallRiskLevel.toUpperCase()} RISK
                </Badge>
              </div>
              
              <div className="space-y-4">
                {data.financialRisks.risks.map((risk) => (
                  <div key={risk.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{risk.category}</h4>
                        <p className="text-sm mt-1">{risk.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getSeverityColor(risk.impact)}>
                          Impact: {risk.impact.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getSeverityColor(risk.probability)}>
                          Probability: {risk.probability.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Mitigation Strategy:</span> {risk.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-2">AI Recommendations</h3>
              <ul className="space-y-2">
                {data.financialRisks.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
          
          <TabsContent value="tax" className="space-y-4">
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Tax Liabilities</h3>
                <div className="text-lg font-bold">
                  Total Due: {formatCurrency(data.taxLiabilities.totalDue)}
                </div>
              </div>
              
              <div className="space-y-4">
                {data.taxLiabilities.liabilities.map((liability) => (
                  <div key={liability.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{liability.taxType}</h4>
                        <p className="text-sm mt-1">{liability.description}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-lg font-medium">{formatCurrency(liability.amount)}</div>
                        <Badge variant="outline" className={getTaxStatusColor(liability.status)}>
                          {liability.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Due Date:</span> {liability.dueDate.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-2">Tax Planning Recommendations</h3>
              <ul className="space-y-2">
                {data.taxLiabilities.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AiInsights;
