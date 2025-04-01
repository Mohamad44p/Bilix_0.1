"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Categories from '../management/Categories';
import Vendors from '../management/Vendors';
import {Grid, Store } from 'lucide-react';

export default function Management() {
  const [activeTab, setActiveTab] = useState<string>('categories');

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Your Business</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage categories and vendors for your invoices.
          </p>
        </div>

        <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="categories" className="flex items-center">
              <Grid className="mr-2 h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center">
              <Store className="mr-2 h-4 w-4" />
              Vendors
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="pt-4">
            <Categories />
          </TabsContent>
          
          <TabsContent value="vendors" className="pt-4">
            <Vendors />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 