"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { InventoryTable } from "@/components/dashboard/inventory/InventoryTable";
import { InventoryFilters } from "@/components/dashboard/inventory/InventoryFilters";
import { AddInventoryItemModal } from "@/components/dashboard/inventory/AddInventoryItemModal";
import { getUserInventory } from "@/lib/services/inventory-service";
import { Inventory } from "@prisma/client";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const loadInventory = async () => {
    setLoading(true);
    try {
      const userId = "test-user-id"; // This would normally come from auth context
      const data = await getUserInventory(userId);
      setInventory(data as any); // Type assertion to fix type mismatch temporarily
    } catch (error) {
      console.error("Failed to load inventory:", error);
      toast({
        title: "Error loading inventory",
        description: "Could not load inventory items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleToggleSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const filteredIds = getFilteredInventory().map((item) => item.id);
      setSelectedItems(filteredIds);
    } else {
      setSelectedItems([]);
    }
  };

  const getFilteredInventory = () => {
    let filtered = [...inventory];

    if (activeTab === "low-stock") {
      filtered = filtered.filter((item) => item.currentQuantity < 5);
    } else if (activeTab === "out-of-stock") {
      filtered = filtered.filter((item) => item.currentQuantity === 0);
    }

    if (filterCategory) {
      filtered = filtered.filter((item) => item.category === filterCategory);
    }

    return filtered;
  };

  const getCategories = () => {
    const categories = inventory
      .map((item) => item.category)
      .filter((category): category is string => !!category);
    return [...new Set(categories)];
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground">
            Track and manage your inventory items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
          </TabsList>
          <InventoryFilters
            categories={getCategories()}
            selectedCategory={filterCategory}
            onCategoryChange={setFilterCategory}
          />
        </div>

        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>
                View and manage all your inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable
                inventory={getFilteredInventory()}
                selectedItemIds={selectedItems}
                onToggleSelection={handleToggleSelection}
                onSelectAll={handleSelectAll}
                loading={loading}
                onRefresh={loadInventory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>
                Items with quantity less than 5 units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable
                inventory={getFilteredInventory()}
                selectedItemIds={selectedItems}
                onToggleSelection={handleToggleSelection}
                onSelectAll={handleSelectAll}
                loading={loading}
                onRefresh={loadInventory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="out-of-stock" className="mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Out of Stock Items</CardTitle>
              <CardDescription>
                Items with zero quantity in stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable
                inventory={getFilteredInventory()}
                selectedItemIds={selectedItems}
                onToggleSelection={handleToggleSelection}
                onSelectAll={handleSelectAll}
                loading={loading}
                onRefresh={loadInventory}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Inventory Item Modal */}
      <AddInventoryItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={loadInventory}
      />
    </div>
  );
}
