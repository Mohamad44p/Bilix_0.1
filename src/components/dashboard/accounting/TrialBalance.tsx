"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type TrialBalanceAccount = {
  id: string;
  accountNumber: string;
  accountName: string;
  debit: number;
  credit: number;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
};

export type TrialBalanceData = {
  accounts: TrialBalanceAccount[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  asOfDate: Date;
  aiValidation: {
    isValid: boolean;
    issues: {
      id: string;
      accountId: string;
      description: string;
      severity: "warning" | "error";
    }[];
  };
};

interface TrialBalanceProps {
  data: TrialBalanceData;
}

const TrialBalance = ({ data }: TrialBalanceProps) => {
  const accountsByType = data.accounts.reduce<Record<string, TrialBalanceAccount[]>>((acc, account) => {
    if (!acc[account.type]) {
      acc[account.type] = [];
    }
    acc[account.type].push(account);
    return acc;
  }, {});

  const typeTotals = Object.entries(accountsByType).map(([type, accounts]) => ({
    type,
    debitTotal: accounts.reduce((sum, account) => sum + account.debit, 0),
    creditTotal: accounts.reduce((sum, account) => sum + account.credit, 0)
  }));

  const formatAccountType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1) + " Accounts";
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trial Balance</CardTitle>
            <CardDescription>Account balances as of {data.asOfDate.toLocaleDateString()}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {data.asOfDate.toLocaleDateString()}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {data.isBalanced ? (
              <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Balanced
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Unbalanced
              </Badge>
            )}
            
            {data.aiValidation.isValid ? (
              <Badge variant="outline" className="bg-green-50 text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                AI Validated
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {data.aiValidation.issues.length} Issue{data.aiValidation.issues.length !== 1 ? 's' : ''} Found
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">Total Debits:</span> ${data.totalDebits.toFixed(2)}
            </div>
            <div className="text-sm">
              <span className="font-medium">Total Credits:</span> ${data.totalCredits.toFixed(2)}
            </div>
            <div className="text-sm">
              <span className="font-medium">Difference:</span> ${Math.abs(data.totalDebits - data.totalCredits).toFixed(2)}
            </div>
          </div>
        </div>
        
        {data.aiValidation.issues.length > 0 && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
            <h3 className="text-sm font-medium text-amber-800 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              AI-Detected Issues
            </h3>
            <ul className="text-sm text-amber-700 space-y-1">
              {data.aiValidation.issues.map((issue) => (
                <li key={issue.id} className="flex items-start">
                  <span className="mr-1">•</span>
                  <span>{issue.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account #</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(accountsByType).map(([type, accounts]) => (
                <React.Fragment key={type}>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="font-medium">
                      {formatAccountType(type)}
                    </TableCell>
                  </TableRow>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.accountNumber}</TableCell>
                      <TableCell>{account.accountName}</TableCell>
                      <TableCell>{account.type}</TableCell>
                      <TableCell className="text-right">
                        {account.debit > 0 ? `$${account.debit.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.credit > 0 ? `$${account.credit.toFixed(2)}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t">
                    <TableCell colSpan={3} className="font-medium text-right">
                      Subtotal:
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${typeTotals.find(t => t.type === type)?.debitTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${typeTotals.find(t => t.type === type)?.creditTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
              <TableRow className="font-bold border-t-2">
                <TableCell colSpan={3} className="text-right">
                  Total:
                </TableCell>
                <TableCell className="text-right">${data.totalDebits.toFixed(2)}</TableCell>
                <TableCell className="text-right">${data.totalCredits.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBalance;
