/**
 * Test script to verify inventory management functionality
 * 
 * This script tests the inventory management system to ensure:
 * 1. Purchase invoices increase inventory
 * 2. Payment invoices decrease inventory
 * 3. Inventory history is tracked correctly
 * 4. Edge cases are handled properly
 */

const mockDb = {
  inventory: [],
  inventoryHistory: [],
  invoices: []
};

const mockUserId = 'user-123';
const mockOrgId = 'org-456';

function createInventoryItem(userId, data) {
  const id = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const item = {
    id,
    ...data,
    userId,
    createdAt: new Date(),
    lastUpdated: new Date(),
    attributes: data.attributes || []
  };
  
  mockDb.inventory.push(item);
  
  const historyId = `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const historyRecord = {
    id: historyId,
    inventoryId: id,
    previousQuantity: 0,
    newQuantity: data.currentQuantity,
    changeReason: 'ADJUSTMENT',
    timestamp: new Date(),
    notes: 'Initial inventory creation'
  };
  
  mockDb.inventoryHistory.push(historyRecord);
  
  return item;
}

function updateInventoryFromInvoice(invoiceId, invoiceType, lineItems, userId, organizationId) {
  for (const item of lineItems) {
    const productName = item.description;
    const quantity = item.quantity || 1;
    
    const effectiveQuantity = quantity <= 0 ? 1 : quantity;
    
    let inventoryItem = mockDb.inventory.find(inv => 
      inv.productName === productName && inv.userId === userId
    );
    
    const quantityChange = invoiceType === 'PURCHASE' ? effectiveQuantity : -effectiveQuantity;
    
    if (inventoryItem) {
      const previousQuantity = inventoryItem.currentQuantity;
      const newQuantity = Math.max(previousQuantity + quantityChange, 0); // Prevent negative inventory
      
      inventoryItem.currentQuantity = newQuantity;
      inventoryItem.lastUpdated = new Date();
      
      const historyId = `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const historyRecord = {
        id: historyId,
        inventoryId: inventoryItem.id,
        previousQuantity,
        newQuantity,
        changeReason: invoiceType,
        invoiceId,
        timestamp: new Date(),
        notes: `${invoiceType === 'PURCHASE' ? 'Added' : 'Removed'} ${effectiveQuantity} units from invoice ${invoiceId}`
      };
      
      mockDb.inventoryHistory.push(historyRecord);
    } else {
      if (invoiceType === 'PURCHASE') {
        const attributes = item.attributes?.map(attr => ({
          name: attr.name,
          value: attr.value
        })) || [];
        
        const newItem = createInventoryItem(userId, {
          productName,
          currentQuantity: effectiveQuantity,
          organizationId,
          attributes
        });
        
        const historyRecord = mockDb.inventoryHistory.find(h => h.inventoryId === newItem.id);
        if (historyRecord) {
          historyRecord.changeReason = 'PURCHASE';
          historyRecord.invoiceId = invoiceId;
          historyRecord.notes = `Initial inventory from purchase invoice ${invoiceId}`;
        }
      }
    }
  }
}

function getInventoryItem(id) {
  return mockDb.inventory.find(item => item.id === id) || null;
}

function getInventoryHistory(inventoryId) {
  return mockDb.inventoryHistory
    .filter(history => history.inventoryId === inventoryId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

function testPurchaseInvoice() {
  console.log('\n=== Testing Purchase Invoice Processing ===');
  
  const purchaseInvoiceId = 'inv-purchase-001';
  const purchaseLineItems = [
    {
      id: 'line-001',
      description: 'Laptop Dell XPS 15',
      quantity: 5,
      unitPrice: 999.99,
      totalPrice: 4999.95,
      attributes: [
        { name: 'color', value: 'silver' },
        { name: 'size', value: '15.6 inch' }
      ]
    },
    {
      id: 'line-002',
      description: 'Wireless Mouse',
      quantity: 10,
      unitPrice: 29.99,
      totalPrice: 299.90,
      attributes: [
        { name: 'color', value: 'black' },
        { name: 'brand', value: 'Logitech' }
      ]
    }
  ];
  
  console.log('Processing purchase invoice...');
  updateInventoryFromInvoice(purchaseInvoiceId, 'PURCHASE', purchaseLineItems, mockUserId, mockOrgId);
  
  const laptopInventory = mockDb.inventory.find(item => item.productName === 'Laptop Dell XPS 15');
  const mouseInventory = mockDb.inventory.find(item => item.productName === 'Wireless Mouse');
  
  console.log(`Laptop inventory quantity: ${laptopInventory ? laptopInventory.currentQuantity : 'Not found'}`);
  console.log(`Mouse inventory quantity: ${mouseInventory ? mouseInventory.currentQuantity : 'Not found'}`);
  
  const laptopCorrect = laptopInventory && laptopInventory.currentQuantity === 5;
  const mouseCorrect = mouseInventory && mouseInventory.currentQuantity === 10;
  
  console.log(`Laptop inventory correct: ${laptopCorrect ? 'YES' : 'NO'}`);
  console.log(`Mouse inventory correct: ${mouseCorrect ? 'YES' : 'NO'}`);
  
  if (laptopInventory) {
    const laptopHistory = getInventoryHistory(laptopInventory.id);
    console.log(`Laptop inventory history records: ${laptopHistory.length}`);
    console.log(`History reason: ${laptopHistory[0].changeReason}`);
    console.log(`History invoice reference: ${laptopHistory[0].invoiceId}`);
  }
  
  return laptopCorrect && mouseCorrect;
}

function testPaymentInvoice() {
  console.log('\n=== Testing Payment Invoice Processing ===');
  
  if (mockDb.inventory.length === 0) {
    testPurchaseInvoice();
  }
  
  const paymentInvoiceId = 'inv-payment-001';
  const paymentLineItems = [
    {
      id: 'line-003',
      description: 'Laptop Dell XPS 15',
      quantity: 2,
      unitPrice: 1299.99,
      totalPrice: 2599.98,
      attributes: [
        { name: 'color', value: 'silver' },
        { name: 'size', value: '15.6 inch' }
      ]
    },
    {
      id: 'line-004',
      description: 'Wireless Mouse',
      quantity: 3,
      unitPrice: 39.99,
      totalPrice: 119.97,
      attributes: [
        { name: 'color', value: 'black' },
        { name: 'brand', value: 'Logitech' }
      ]
    }
  ];
  
  const laptopInventory = mockDb.inventory.find(item => item.productName === 'Laptop Dell XPS 15');
  const mouseInventory = mockDb.inventory.find(item => item.productName === 'Wireless Mouse');
  
  const initialLaptopQuantity = laptopInventory ? laptopInventory.currentQuantity : 0;
  const initialMouseQuantity = mouseInventory ? mouseInventory.currentQuantity : 0;
  
  console.log(`Initial laptop quantity: ${initialLaptopQuantity}`);
  console.log(`Initial mouse quantity: ${initialMouseQuantity}`);
  
  console.log('Processing payment invoice...');
  updateInventoryFromInvoice(paymentInvoiceId, 'PAYMENT', paymentLineItems, mockUserId, mockOrgId);
  
  const updatedLaptopInventory = mockDb.inventory.find(item => item.productName === 'Laptop Dell XPS 15');
  const updatedMouseInventory = mockDb.inventory.find(item => item.productName === 'Wireless Mouse');
  
  const expectedLaptopQuantity = initialLaptopQuantity - 2;
  const expectedMouseQuantity = initialMouseQuantity - 3;
  
  console.log(`Updated laptop quantity: ${updatedLaptopInventory.currentQuantity} (Expected: ${expectedLaptopQuantity})`);
  console.log(`Updated mouse quantity: ${updatedMouseInventory.currentQuantity} (Expected: ${expectedMouseQuantity})`);
  
  const laptopCorrect = updatedLaptopInventory.currentQuantity === expectedLaptopQuantity;
  const mouseCorrect = updatedMouseInventory.currentQuantity === expectedMouseQuantity;
  
  console.log(`Laptop inventory decrease correct: ${laptopCorrect ? 'YES' : 'NO'}`);
  console.log(`Mouse inventory decrease correct: ${mouseCorrect ? 'YES' : 'NO'}`);
  
  if (updatedLaptopInventory) {
    const laptopHistory = getInventoryHistory(updatedLaptopInventory.id);
    console.log(`Laptop inventory history records: ${laptopHistory.length}`);
    console.log(`Latest history reason: ${laptopHistory[0].changeReason}`);
    console.log(`Latest history invoice reference: ${laptopHistory[0].invoiceId}`);
  }
  
  return laptopCorrect && mouseCorrect;
}

function testEdgeCases() {
  console.log('\n=== Testing Edge Cases ===');
  
  console.log('\nTest Case 1: Zero quantity line item');
  
  const initialInventoryItems = [...mockDb.inventory];
  mockDb.inventory = [];
  
  const zeroQuantityInvoiceId = 'inv-edge-001';
  const zeroQuantityLineItems = [
    {
      id: 'line-zero',
      description: 'Zero Quantity Item',
      quantity: 0,
      unitPrice: 10.00,
      totalPrice: 0,
      attributes: [
        { name: 'test', value: 'zero' }
      ]
    }
  ];
  
  console.log(`Line item quantity: ${zeroQuantityLineItems[0].quantity}`);
  console.log(`Initial inventory count: ${mockDb.inventory.length}`);
  
  updateInventoryFromInvoice(zeroQuantityInvoiceId, 'PURCHASE', zeroQuantityLineItems, mockUserId, mockOrgId);
  
  const afterZeroInventoryCount = mockDb.inventory.length;
  console.log(`Inventory count after zero quantity: ${afterZeroInventoryCount}`);
  
  const zeroItem = mockDb.inventory.find(item => item.productName === 'Zero Quantity Item');
  console.log(`Zero quantity item created: ${zeroItem ? 'YES' : 'NO'}`);
  
  const zeroQuantityCorrect = zeroItem && zeroItem.currentQuantity === 1;
  console.log(`Zero quantity handled correctly: ${zeroQuantityCorrect ? 'YES' : 'NO'}`);
  
  mockDb.inventory = initialInventoryItems;
  
  console.log('\nTest Case 2: Prevent negative inventory');
  
  const lowQuantityItem = createInventoryItem(mockUserId, {
    productName: 'Low Quantity Item',
    currentQuantity: 1,
    organizationId: mockOrgId
  });
  
  console.log(`Created low quantity item with quantity: ${lowQuantityItem.currentQuantity}`);
  
  const excessSaleInvoiceId = 'inv-edge-002';
  const excessSaleLineItems = [
    {
      id: 'line-excess',
      description: 'Low Quantity Item',
      quantity: 5, // More than available
      unitPrice: 10.00,
      totalPrice: 50.00
    }
  ];
  
  updateInventoryFromInvoice(excessSaleInvoiceId, 'PAYMENT', excessSaleLineItems, mockUserId, mockOrgId);
  
  const updatedLowQuantityItem = mockDb.inventory.find(item => item.id === lowQuantityItem.id);
  console.log(`Low quantity item after excess sale: ${updatedLowQuantityItem.currentQuantity}`);
  
  const negativePreventionCorrect = updatedLowQuantityItem.currentQuantity === 0; // Should be 0, not negative
  console.log(`Negative inventory prevention correct: ${negativePreventionCorrect ? 'YES' : 'NO'}`);
  
  console.log('\nTest Case 3: Duplicate items in same invoice');
  
  const duplicateItem = createInventoryItem(mockUserId, {
    productName: 'Duplicate Item',
    currentQuantity: 10,
    organizationId: mockOrgId
  });
  
  console.log(`Created duplicate item with quantity: ${duplicateItem.currentQuantity}`);
  
  const duplicateInvoiceId = 'inv-edge-003';
  const duplicateLineItems = [
    {
      id: 'line-dup-1',
      description: 'Duplicate Item',
      quantity: 2,
      unitPrice: 10.00,
      totalPrice: 20.00
    },
    {
      id: 'line-dup-2',
      description: 'Duplicate Item', // Same item
      quantity: 3,
      unitPrice: 10.00,
      totalPrice: 30.00
    }
  ];
  
  updateInventoryFromInvoice(duplicateInvoiceId, 'PURCHASE', duplicateLineItems, mockUserId, mockOrgId);
  
  const updatedDuplicateItem = mockDb.inventory.find(item => item.id === duplicateItem.id);
  console.log(`Duplicate item after purchase: ${updatedDuplicateItem.currentQuantity}`);
  
  const expectedDuplicateQuantity = 10 + 2 + 3; // Initial + first line + second line
  const duplicateHandlingCorrect = updatedDuplicateItem.currentQuantity === expectedDuplicateQuantity;
  console.log(`Duplicate item handling correct: ${duplicateHandlingCorrect ? 'YES' : 'NO'}`);
  
  return zeroQuantityCorrect && negativePreventionCorrect && duplicateHandlingCorrect;
}

function runTests() {
  console.log('=== TESTING INVENTORY MANAGEMENT ===\n');
  
  const purchaseTestResult = testPurchaseInvoice();
  const paymentTestResult = testPaymentInvoice();
  const edgeCaseTestResult = testEdgeCases();
  
  console.log('\n=== TEST RESULTS ===');
  console.log(`Purchase invoice processing: ${purchaseTestResult ? 'PASS' : 'FAIL'}`);
  console.log(`Payment invoice processing: ${paymentTestResult ? 'PASS' : 'FAIL'}`);
  console.log(`Edge case handling: ${edgeCaseTestResult ? 'PASS' : 'FAIL'}`);
  
  const allTestsPassed = purchaseTestResult && paymentTestResult && edgeCaseTestResult;
  
  console.log(`\nOverall result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  console.log('\nFinal Inventory State:');
  mockDb.inventory.forEach(item => {
    console.log(`- ${item.productName}: ${item.currentQuantity} units`);
  });
  
  return allTestsPassed;
}

try {
  const result = runTests();
  console.log(`\nTest execution ${result ? 'successful' : 'failed'}`);
} catch (error) {
  console.error('Error running inventory tests:', error);
}
