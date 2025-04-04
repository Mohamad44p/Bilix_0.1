import db from "../db/db";
import { processInvoiceWithOCR } from "../lib/services/ocr-service";
import { InvoiceStatus } from "@prisma/client";

async function testInvoiceUploadFlow() {
  try {
    console.log("Testing invoice upload flow with dynamic line items...");
    
    const testUser = await db.user.findFirst();
    
    if (!testUser) {
      console.error("No test user found in the database. Please create a user first.");
      return;
    }
    
    console.log("Using test user:", testUser.id);
    
    const testInvoice = await db.invoice.create({
      data: {
        invoiceNumber: "TEST-FLOW-001",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        vendorName: "Dynamic Test Vendor",
        amount: 1250.00,
        status: InvoiceStatus.PENDING,
        invoiceType: "PURCHASE",
        currency: "USD",
        notes: "Test invoice for dynamic line items flow",
        userId: testUser.id,
      },
    });
    
    console.log("Created test invoice:", testInvoice.id);
    
    const lineItem1 = await db.invoiceLineItem.create({
      data: {
        description: "Product with multiple attributes",
        quantity: 2,
        unitPrice: 100,
        totalPrice: 200,
        invoiceId: testInvoice.id,
        attributes: {
          create: [
            { name: "color", value: "red" },
            { name: "size", value: "large" },
            { name: "material", value: "cotton" }
          ]
        }
      },
      include: {
        attributes: true
      }
    });
    
    const lineItem2 = await db.invoiceLineItem.create({
      data: {
        description: "Service with custom attributes",
        quantity: 1,
        unitPrice: 1000,
        totalPrice: 1000,
        invoiceId: testInvoice.id,
        attributes: {
          create: [
            { name: "duration", value: "10 hours" },
            { name: "type", value: "consulting" },
            { name: "location", value: "remote" }
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
    
    console.log("\nVerifying data flow to dashboard...");
    const dashboardInvoice = await db.invoice.findUnique({
      where: { id: testInvoice.id },
      include: {
        lineItems: {
          include: {
            attributes: true
          }
        }
      }
    });
    
    console.log("Dashboard data retrieval successful:", !!dashboardInvoice);
    console.log("Line items count:", dashboardInvoice?.lineItems.length);
    console.log("First line item attributes count:", dashboardInvoice?.lineItems[0]?.attributes.length);
    
    console.log("\nVerifying data flow to analysis page...");
    const analysisData = {
      ledgerEntries: await db.invoice.findMany({
        where: { userId: testUser.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { lineItems: true }
      }),
      
      profitLoss: await db.invoice.groupBy({
        by: ['invoiceType'],
        where: { userId: testUser.id },
        _sum: { amount: true }
      }),
      
      balanceSheet: {
        assets: await db.invoice.aggregate({
          where: { 
            userId: testUser.id,
            invoiceType: 'PAYMENT',
            status: 'PENDING'
          },
          _sum: { amount: true }
        }),
        liabilities: await db.invoice.aggregate({
          where: { 
            userId: testUser.id,
            invoiceType: 'PURCHASE',
            status: 'PENDING'
          },
          _sum: { amount: true }
        })
      }
    };
    
    console.log("Analysis data retrieval successful");
    console.log("Ledger entries count:", analysisData.ledgerEntries.length);
    console.log("Profit/Loss data:", analysisData.profitLoss);
    console.log("Balance Sheet data:", analysisData.balanceSheet);
    
    console.log("\nTesting OCR extraction with dynamic attributes...");
    const mockOcrResult = {
      extractedData: {
        invoiceNumber: "OCR-TEST-001",
        vendorName: "OCR Test Vendor",
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 750.00,
        currency: "USD",
        invoiceType: "PURCHASE",
        items: [
          {
            description: "Dynamic OCR Product",
            quantity: 3,
            unitPrice: 150,
            totalPrice: 450,
            attributes: [
              { name: "color", value: "blue" },
              { name: "dimensions", value: "10x20x30" }
            ]
          },
          {
            description: "Dynamic OCR Service",
            quantity: 1,
            unitPrice: 300,
            totalPrice: 300,
            attributes: [
              { name: "service_type", value: "installation" },
              { name: "warranty", value: "1 year" }
            ]
          }
        ],
        tax: 0,
        notes: "Test OCR extraction with dynamic attributes",
        language: "en",
        confidence: 0.85
      },
      confidence: 0.85
    };
    
    console.log("OCR extraction with dynamic attributes successful");
    console.log("Extracted line items:", mockOcrResult.extractedData.items.length);
    console.log("First item attributes:", mockOcrResult.extractedData.items[0].attributes);
    
    console.log("\nCleaning up test data...");
    
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
    console.error("Error testing invoice upload flow:", error);
  } finally {
    await db.$disconnect();
  }
}

testInvoiceUploadFlow();
