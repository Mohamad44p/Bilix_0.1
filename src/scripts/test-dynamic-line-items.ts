import db from "../db/db";

async function testDynamicLineItems() {
  try {
    console.log("Testing dynamic line item attributes...");
    
    const testUser = await db.user.findFirst();
    
    if (!testUser) {
      console.error("No test user found in the database. Please create a user first.");
      return;
    }
    
    console.log("Using test user:", testUser.id);
    
    const testInvoice = await db.invoice.create({
      data: {
        invoiceNumber: "TEST-001",
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        vendorName: "Test Vendor",
        total: 1250.00,
        subtotal: 1200.00,
        tax: 50.00,
        status: "PENDING",
        type: "PAYMENT",
        currency: "USD",
        notes: "Test invoice for dynamic line items",
        userId: testUser.id,
      },
    });
    
    console.log("Created test invoice:", testInvoice.id);
    
    const lineItem1 = await db.invoiceLineItem.create({
      data: {
        description: "Product A",
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
        invoiceId: testInvoice.id,
        attributes: {
          create: [
            { name: "color", value: "red" },
            { name: "size", value: "large" }
          ]
        }
      },
      include: {
        attributes: true
      }
    });
    
    const lineItem2 = await db.invoiceLineItem.create({
      data: {
        description: "Service B",
        quantity: 1,
        unitPrice: 1000,
        totalPrice: 1000,
        invoiceId: testInvoice.id,
        attributes: {
          create: [
            { name: "duration", value: "10 hours" },
            { name: "type", value: "consulting" }
          ]
        }
      },
      include: {
        attributes: true
      }
    });
    
    console.log("Created line items with dynamic attributes:");
    console.log(JSON.stringify(lineItem1, null, 2));
    console.log(JSON.stringify(lineItem2, null, 2));
    
    const retrievedInvoice = await db.invoice.findUnique({
      where: { id: testInvoice.id },
      include: {
        lineItems: {
          include: {
            attributes: true
          }
        }
      }
    });
    
    console.log("Retrieved invoice with line items and attributes:");
    console.log(JSON.stringify(retrievedInvoice, null, 2));
    
    await db.lineItemAttribute.deleteMany({
      where: {
        lineItemId: {
          in: [lineItem1.id, lineItem2.id]
        }
      }
    });
    
    await db.invoiceLineItem.deleteMany({
      where: {
        invoiceId: testInvoice.id
      }
    });
    
    await db.invoice.delete({
      where: {
        id: testInvoice.id
      }
    });
    
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Error testing line items:", error);
  } finally {
    await db.$disconnect();
  }
}

testDynamicLineItems();
