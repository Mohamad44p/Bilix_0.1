import db from "../../db/db";
import { InventoryItem, InventoryAttribute, InventoryHistory, InvoiceLineItem } from "../types";

/**
 * Get all inventory items for a user
 */
export async function getUserInventory(userId: string): Promise<InventoryItem[]> {
  const inventoryItems = await db.inventory.findMany({
    where: {
      userId
    },
    include: {
      attributes: true
    },
    orderBy: {
      productName: 'asc'
    }
  });
  
  return inventoryItems.map((item: any) => ({
    id: item.id,
    productName: item.productName,
    description: item.description || undefined,
    sku: item.sku || undefined,
    currentQuantity: item.currentQuantity,
    unitOfMeasure: item.unitOfMeasure || undefined,
    category: item.category || undefined,
    lastUpdated: item.lastUpdated,
    createdAt: item.createdAt,
    attributes: item.attributes.map((attr: any) => ({
      id: attr.id,
      name: attr.name,
      value: attr.value,
      inventoryId: attr.inventoryId
    }))
  }));
}

/**
 * Get inventory item by ID
 */
export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const item = await db.inventory.findUnique({
    where: { id },
    include: {
      attributes: true
    }
  });
  
  if (!item) return null;
  
  return {
    id: item.id,
    productName: item.productName,
    description: item.description || undefined,
    sku: item.sku || undefined,
    currentQuantity: item.currentQuantity,
    unitOfMeasure: item.unitOfMeasure || undefined,
    category: item.category || undefined,
    lastUpdated: item.lastUpdated,
    createdAt: item.createdAt,
    attributes: item.attributes.map((attr: any) => ({
      id: attr.id,
      name: attr.name,
      value: attr.value,
      inventoryId: attr.inventoryId
    }))
  };
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(
  userId: string, 
  data: { 
    productName: string;
    description?: string;
    sku?: string;
    currentQuantity: number;
    unitOfMeasure?: string;
    category?: string;
    organizationId?: string;
    attributes?: { name: string; value: string; }[];
  }
): Promise<InventoryItem> {
  const { attributes, ...itemData } = data;
  
  const item = await db.inventory.create({
    data: {
      ...itemData,
      userId,
      attributes: {
        create: attributes || []
      },
      history: {
        create: {
          previousQuantity: 0,
          newQuantity: data.currentQuantity,
          changeReason: 'ADJUSTMENT',
          notes: 'Initial inventory creation'
        }
      }
    },
    include: {
      attributes: true
    }
  });
  
  return {
    id: item.id,
    productName: item.productName,
    description: item.description || undefined,
    sku: item.sku || undefined,
    currentQuantity: item.currentQuantity,
    unitOfMeasure: item.unitOfMeasure || undefined,
    category: item.category || undefined,
    lastUpdated: item.lastUpdated,
    createdAt: item.createdAt,
    attributes: item.attributes.map((attr: any) => ({
      id: attr.id,
      name: attr.name,
      value: attr.value,
      inventoryId: attr.inventoryId
    }))
  };
}

/**
 * Update inventory quantity based on invoice line items
 */
export async function updateInventoryFromInvoice(
  invoiceId: string, 
  invoiceType: 'PURCHASE' | 'PAYMENT',
  lineItems: InvoiceLineItem[],
  userId: string,
  organizationId?: string
): Promise<void> {
  for (const item of lineItems) {
    const productName = item.description;
    const quantity = item.quantity || 1;
    
    if (quantity <= 0) continue;
    
    let inventoryItem = await db.inventory.findFirst({
      where: {
        productName,
        userId
      }
    });
    
    const quantityChange = invoiceType === 'PURCHASE' ? quantity : -quantity;
    
    if (inventoryItem) {
      const previousQuantity = inventoryItem.currentQuantity;
      const newQuantity = Math.max(previousQuantity + quantityChange, 0); // Prevent negative inventory
      
      await db.inventory.update({
        where: { id: inventoryItem.id },
        data: {
          currentQuantity: newQuantity,
          history: {
            create: {
              previousQuantity,
              newQuantity,
              changeReason: invoiceType,
              invoiceId,
              notes: `${invoiceType === 'PURCHASE' ? 'Added' : 'Removed'} ${quantity} units from invoice ${invoiceId}`
            }
          }
        }
      });
    } else {
      if (invoiceType === 'PURCHASE') {
        const attributes = item.attributes?.map(attr => ({
          name: attr.name,
          value: attr.value
        })) || [];
        
        await db.inventory.create({
          data: {
            productName,
            currentQuantity: quantity,
            userId,
            organizationId,
            attributes: {
              create: attributes
            },
            history: {
              create: {
                previousQuantity: 0,
                newQuantity: quantity,
                changeReason: 'PURCHASE',
                invoiceId,
                notes: `Initial inventory from purchase invoice ${invoiceId}`
              }
            }
          }
        });
      }
    }
  }
}

/**
 * Get inventory history for an item
 */
export async function getInventoryHistory(inventoryId: string): Promise<InventoryHistory[]> {
  const history = await db.inventoryHistory.findMany({
    where: { inventoryId },
    orderBy: { timestamp: 'desc' },
    include: { invoice: true }
  });
  
  return history.map((entry: any) => ({
    id: entry.id,
    inventoryId: entry.inventoryId,
    previousQuantity: entry.previousQuantity,
    newQuantity: entry.newQuantity,
    changeReason: entry.changeReason as 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN',
    invoiceId: entry.invoiceId || undefined,
    timestamp: entry.timestamp,
    notes: entry.notes || undefined
  }));
}

/**
 * Update an existing inventory item
 */
export async function updateInventoryItem(
  id: string,
  data: {
    productName?: string;
    description?: string;
    sku?: string;
    currentQuantity?: number;
    unitOfMeasure?: string;
    category?: string;
    attributes?: { name: string; value: string; }[];
  }
): Promise<InventoryItem | null> {
  const { attributes, ...itemData } = data;
  
  let historyUpdate = {};
  if (data.currentQuantity !== undefined) {
    const currentItem = await db.inventory.findUnique({
      where: { id }
    });
    
    if (currentItem && currentItem.currentQuantity !== data.currentQuantity) {
      historyUpdate = {
        history: {
          create: {
            previousQuantity: currentItem.currentQuantity,
            newQuantity: data.currentQuantity,
            changeReason: 'ADJUSTMENT',
            notes: 'Manual inventory adjustment'
          }
        }
      };
    }
  }
  
  let attributesUpdate = {};
  if (attributes) {
    attributesUpdate = {
      attributes: {
        deleteMany: {},
        create: attributes
      }
    };
  }
  
  try {
    const item = await db.inventory.update({
      where: { id },
      data: {
        ...itemData,
        ...historyUpdate,
        ...attributesUpdate
      },
      include: {
        attributes: true
      }
    });
    
    return {
      id: item.id,
      productName: item.productName,
      description: item.description || undefined,
      sku: item.sku || undefined,
      currentQuantity: item.currentQuantity,
      unitOfMeasure: item.unitOfMeasure || undefined,
      category: item.category || undefined,
      lastUpdated: item.lastUpdated,
      createdAt: item.createdAt,
      attributes: item.attributes.map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        value: attr.value,
        inventoryId: attr.inventoryId
      }))
    };
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return null;
  }
}

/**
 * Delete an inventory item
 */
export async function deleteInventoryItem(id: string): Promise<boolean> {
  try {
    await db.inventory.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return false;
  }
}

/**
 * Search inventory items
 */
export async function searchInventory(
  userId: string,
  query: string,
  filters?: {
    category?: string;
    minQuantity?: number;
    maxQuantity?: number;
  }
): Promise<InventoryItem[]> {
  const where: any = {
    userId,
    OR: [
      { productName: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { sku: { contains: query, mode: 'insensitive' } }
    ]
  };
  
  if (filters) {
    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }
    
    if (filters.minQuantity !== undefined) {
      where.currentQuantity = { gte: filters.minQuantity };
    }
    
    if (filters.maxQuantity !== undefined) {
      where.currentQuantity = { 
        ...(where.currentQuantity || {}),
        lte: filters.maxQuantity 
      };
    }
  }
  
  const inventoryItems = await db.inventory.findMany({
    where,
    include: {
      attributes: true
    },
    orderBy: {
      productName: 'asc'
    }
  });
  
  return inventoryItems.map((item: any) => ({
    id: item.id,
    productName: item.productName,
    description: item.description || undefined,
    sku: item.sku || undefined,
    currentQuantity: item.currentQuantity,
    unitOfMeasure: item.unitOfMeasure || undefined,
    category: item.category || undefined,
    lastUpdated: item.lastUpdated,
    createdAt: item.createdAt,
    attributes: item.attributes.map((attr: any) => ({
      id: attr.id,
      name: attr.name,
      value: attr.value,
      inventoryId: attr.inventoryId
    }))
  }));
}
