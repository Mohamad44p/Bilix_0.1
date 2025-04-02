"use client";

import React, { useEffect, useState } from 'react'
import AISettingsComponent from '@/components/dashboard/settings/AISettings';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getUserCategories } from '@/lib/actions/invoice';
import { Category } from '@/lib/types';

export default function AISettingsPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getUserCategories();
        // Extract category names
        const categoryNames = categoriesData.map((cat: Category | any) => 
          typeof cat === 'string' ? cat : cat.name
        );
        setCategories(categoryNames);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Settings</h1>
          <p className="text-muted-foreground">
            Customize how AI processes your invoices
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <AISettingsComponent existingCategories={categories} />
      )}
    </DashboardLayout>
  );
} 