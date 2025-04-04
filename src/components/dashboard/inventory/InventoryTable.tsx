"use client";

import { useState } from "react";
import {
  Package,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  AlertTriangle,
  CheckCircle,
  History
} from "lucide-react";
import { Inventory, InventoryAttribute } from "@prisma/client";
import { formatDate } from "../../../lib/utils";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Skeleton } from "../../../components/ui/skeleton";
import { cn } from "../../../lib/utils";
import { useToast } from "../../../components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Card, CardContent } from "../../../components/ui/card";
import { EditInventoryItemModal } from "../../../components/dashboard/inventory/EditInventoryItemModal";
import { InventoryHistoryModal } from "../../../components/dashboard/inventory/InventoryHistoryModal";
import { deleteInventoryItem } from "@/lib/services/inventory-service";

interface InventoryTableProps {
  inventory: Inventory[];
  selectedItemIds: string[];
  onToggleSelection: (itemId: string) => void;
  onSelectAll: (selected: boolean) => void;
  loading: boolean;
  onRefresh: () => void;
}

type InventoryWithAttributes = Inventory & {
  attributes?: InventoryAttribute[];
};

export function InventoryTable({
  inventory,
  selectedItemIds,
  onToggleSelection,
  onSelectAll,
  loading,
  onRefresh,
}: InventoryTableProps) {
  const [previewItem, setPreviewItem] = useState<InventoryWithAttributes | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Inventory | null>(null);
  const [editItem, setEditItem] = useState<InventoryWithAttributes | null>(null);
  const [showHistory, setShowHistory] = useState<Inventory | null>(null);
  const [processing, setProcessing] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  
  const allSelected = inventory.length > 0 && selectedItemIds.length === inventory.length;
  
  const handleDelete = async (item: Inventory) => {
    setProcessing(prev => ({ ...prev, [item.id]: true }));
    setConfirmDelete(null);
    
    try {
      await deleteInventoryItem(item.id);
      
      toast({
        title: "Item deleted",
        description: `${item.productName} has been deleted from inventory`,
      });
      
      onRefresh();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    } finally {
      setProcessing(prev => ({ ...prev, [item.id]: false }));
    }
  };
  
  const getStockStatusBadge = (quantity: number) => {
    if (quantity <= 0) {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
        >
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Out of Stock</span>
          </div>
        </Badge>
      );
    } else if (quantity < 5) {
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
        >
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Low Stock</span>
          </div>
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900"
        >
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>In Stock</span>
          </div>
        </Badge>
      );
    }
  };

  if (loading && inventory.length === 0) {
    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox disabled />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <Checkbox disabled />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="flex justify-end">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
        </div>
        <h3 className="text-lg font-medium mb-2">No inventory items found</h3>
        <p className="text-muted-foreground mb-6">
          No items match your current search or filters
        </p>
        <Button onClick={onRefresh} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => (
            <TableRow 
              key={item.id}
              className={cn({
                "bg-primary/5": selectedItemIds.includes(item.id),
                "opacity-70": processing[item.id]
              })}
            >
              <TableCell>
                <Checkbox 
                  checked={selectedItemIds.includes(item.id)}
                  onCheckedChange={() => onToggleSelection(item.id)}
                  disabled={processing[item.id]}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {item.productName}
                </div>
                {item.description && (
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {item.description}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {item.sku || <span className="text-muted-foreground text-sm">No SKU</span>}
              </TableCell>
              <TableCell>
                {item.category ? (
                  <Badge variant="secondary">{item.category}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Uncategorized</span>
                )}
              </TableCell>
              <TableCell className="font-medium">
                {item.currentQuantity} {item.unitOfMeasure || 'units'}
              </TableCell>
              <TableCell>
                {getStockStatusBadge(item.currentQuantity)}
              </TableCell>
              <TableCell>
                {formatDate(item.lastUpdated)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewItem(item)}
                    disabled={processing[item.id]}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistory(item)}
                    disabled={processing[item.id]}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={processing[item.id]}>
                        {processing[item.id] ? (
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewItem(item)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowHistory(item)}>
                        <History className="mr-2 h-4 w-4" /> View History
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditItem(item)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setConfirmDelete(item)} className="text-red-500 focus:text-red-500">
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Item Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          {previewItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {previewItem.productName}
                </DialogTitle>
                <DialogDescription>
                  {previewItem.sku ? `SKU: ${previewItem.sku}` : 'No SKU'} • Last updated {formatDate(previewItem.lastUpdated)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Product Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Product Name:</span>
                        <span className="font-medium">{previewItem.productName}</span>
                      </div>
                      {previewItem.description && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Description:</span>
                          <span>{previewItem.description}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{previewItem.category || 'Uncategorized'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Quantity:</span>
                        <span className="font-medium">{previewItem.currentQuantity} {previewItem.unitOfMeasure || 'units'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span>{getStockStatusBadge(previewItem.currentQuantity)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Attributes</h3>
                    {previewItem.attributes && previewItem.attributes.length > 0 ? (
                      <div className="space-y-2">
                        {previewItem.attributes.map((attr) => (
                          <div key={attr.id} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{attr.name}:</span>
                            <span>{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No attributes available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewItem(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setEditItem(previewItem);
                  setPreviewItem(null);
                }}>
                  Edit Item
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{confirmDelete?.productName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              disabled={processing[confirmDelete?.id || '']}
            >
              {processing[confirmDelete?.id || ''] ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      {editItem && (
        <EditInventoryItemModal
          open={!!editItem}
          onOpenChange={(open: boolean) => !open && setEditItem(null)}
          item={editItem}
          onSuccess={() => {
            setEditItem(null);
            onRefresh();
          }}
        />
      )}

      {/* History Modal */}
      {showHistory && (
        <InventoryHistoryModal
          open={!!showHistory}
          onOpenChange={(open: boolean) => !open && setShowHistory(null)}
          itemId={showHistory.id}
          itemName={showHistory.productName}
        />
      )}
    </div>
  );
}
