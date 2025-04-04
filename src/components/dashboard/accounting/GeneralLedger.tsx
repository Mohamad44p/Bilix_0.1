"use client";

import React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Filter, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type LedgerEntry = {
  id: string;
  date: Date;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  account: string;
  balance: number;
  invoiceId?: string;
};

interface GeneralLedgerProps {
  entries: LedgerEntry[];
}

const GeneralLedger = ({ entries }: GeneralLedgerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  
  const uniqueAccounts = Array.from(new Set(entries.map(entry => entry.account)));
  
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchTerm === "" || 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesAccount = accountFilter === null || entry.account === accountFilter;
    
    return matchesSearch && matchesAccount;
  });
  
  const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const netBalance = totalDebits - totalCredits;
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>General Ledger</CardTitle>
            <CardDescription>Complete record of all financial transactions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={accountFilter || ""} onValueChange={(value) => setAccountFilter(value || null)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All accounts</SelectItem>
                {uniqueAccounts.map((account) => (
                  <SelectItem key={account} value={account}>
                    {account}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 bg-green-50">
              Total Debits: ${totalDebits.toFixed(2)}
            </Badge>
            <Badge variant="outline" className="text-red-600 bg-red-50">
              Total Credits: ${totalCredits.toFixed(2)}
            </Badge>
            <Badge variant={netBalance >= 0 ? "default" : "destructive"}>
              Net: ${Math.abs(netBalance).toFixed(2)} {netBalance >= 0 ? "DR" : "CR"}
            </Badge>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No ledger entries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date.toLocaleDateString()}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.reference}</TableCell>
                    <TableCell>{entry.account}</TableCell>
                    <TableCell className="text-right">
                      {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Math.abs(entry.balance).toFixed(2)} {entry.balance >= 0 ? "DR" : "CR"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralLedger;
