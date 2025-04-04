/**
 * Test script to verify AI learning functionality with user feedback
 * 
 * This script tests the AI learning system to ensure:
 * 1. User feedback is correctly stored
 * 2. Future suggestions improve based on feedback
 * 3. Personalized filters work for different users
 * 4. The AI learning system adapts to user preferences over time
 */

const mockDb = {
  aiFeedback: [],
  users: [
    { id: 'user-1', name: 'User 1' },
    { id: 'user-2', name: 'User 2' }
  ],
  invoices: [
    { id: 'inv-1', userId: 'user-1' },
    { id: 'inv-2', userId: 'user-1' },
    { id: 'inv-3', userId: 'user-2' }
  ]
};

function storeExtractionFeedback(userId, invoiceId, feedbackData) {
  const feedback = {
    id: `feedback-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    invoiceId,
    field: feedbackData.field,
    originalValue: feedbackData.originalValue,
    correctedValue: feedbackData.correctedValue,
    vendorName: feedbackData.vendorName || null,
    confidence: feedbackData.confidence || 0.5,
    feedbackType: 'EXTRACTION',
    timestamp: new Date()
  };
  
  mockDb.aiFeedback.push(feedback);
  return feedback;
}

function storeCategoryFeedback(userId, invoiceId, originalCategory, correctedCategory, vendorName) {
  const feedback = {
    id: `feedback-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    invoiceId,
    field: 'category',
    originalValue: originalCategory,
    correctedValue: correctedCategory,
    vendorName: vendorName || null,
    confidence: 0.8,
    feedbackType: 'CATEGORY',
    timestamp: new Date()
  };
  
  mockDb.aiFeedback.push(feedback);
  return feedback;
}

function storeVendorFeedback(userId, invoiceId, originalVendor, correctedVendor) {
  const feedback = {
    id: `feedback-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    invoiceId,
    field: 'vendorName',
    originalValue: originalVendor,
    correctedValue: correctedVendor,
    vendorName: correctedVendor,
    confidence: 0.9,
    feedbackType: 'VENDOR',
    timestamp: new Date()
  };
  
  mockDb.aiFeedback.push(feedback);
  return feedback;
}

function storeAttributeFeedback(userId, invoiceId, itemDescription, attributeName, originalValue, correctedValue) {
  const feedback = {
    id: `feedback-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    invoiceId,
    field: `attribute.${attributeName}`,
    originalValue,
    correctedValue,
    vendorName: null,
    itemDescription,
    confidence: 0.7,
    feedbackType: 'ATTRIBUTE',
    timestamp: new Date()
  };
  
  mockDb.aiFeedback.push(feedback);
  return feedback;
}

function getPersonalizedCategorySuggestions(userId, vendorName, extractedData, baseCategories) {
  let suggestedCategories = [...baseCategories];
  
  const userFeedback = mockDb.aiFeedback.filter(feedback => 
    feedback.userId === userId && 
    feedback.feedbackType === 'CATEGORY' &&
    feedback.vendorName === vendorName
  );
  
  if (userFeedback.length > 0) {
    const userPreferredCategories = [...new Set(
      userFeedback.map(feedback => feedback.correctedValue)
    )];
    
    suggestedCategories = [
      ...userPreferredCategories,
      ...suggestedCategories.filter(cat => !userPreferredCategories.includes(cat))
    ];
  }
  
  return suggestedCategories.slice(0, 8);
}

function getPersonalizedVendorSuggestions(userId, extractedVendor, existingVendors) {
  let suggestedVendors = [...existingVendors];
  
  const userVendorFeedback = mockDb.aiFeedback.filter(feedback => 
    feedback.userId === userId && 
    feedback.feedbackType === 'VENDOR'
  );
  
  if (userVendorFeedback.length > 0) {
    const userPreferredVendors = [...new Set(
      userVendorFeedback.map(feedback => feedback.correctedValue)
    )];
    
    suggestedVendors = [
      ...userPreferredVendors,
      ...suggestedVendors.filter(vendor => !userPreferredVendors.includes(vendor))
    ];
  }
  
  if (extractedVendor) {
    const extractedLower = extractedVendor.toLowerCase();
    suggestedVendors = suggestedVendors.filter(vendor => 
      vendor.toLowerCase().includes(extractedLower) || 
      extractedLower.includes(vendor.toLowerCase())
    );
  }
  
  return suggestedVendors.slice(0, 5);
}

function testStoreFeedback() {
  console.log('\n=== Testing Storing User Feedback ===');
  
  const userId = 'user-1';
  const invoiceId = 'inv-1';
  
  console.log('\nTest Case 1: Store extraction feedback');
  const extractionFeedback = storeExtractionFeedback(
    userId,
    invoiceId,
    {
      field: 'invoiceNumber',
      originalValue: 'INV-123',
      correctedValue: 'INV-123-A',
      confidence: 0.7
    }
  );
  
  console.log(`Extraction feedback stored: ${extractionFeedback ? 'YES' : 'NO'}`);
  console.log(`Feedback type: ${extractionFeedback.feedbackType}`);
  console.log(`Field: ${extractionFeedback.field}`);
  console.log(`Original value: ${extractionFeedback.originalValue}`);
  console.log(`Corrected value: ${extractionFeedback.correctedValue}`);
  
  console.log('\nTest Case 2: Store category feedback');
  const categoryFeedback = storeCategoryFeedback(
    userId,
    invoiceId,
    'Office Supplies',
    'Electronics',
    'Amazon'
  );
  
  console.log(`Category feedback stored: ${categoryFeedback ? 'YES' : 'NO'}`);
  console.log(`Feedback type: ${categoryFeedback.feedbackType}`);
  console.log(`Vendor name: ${categoryFeedback.vendorName}`);
  console.log(`Original category: ${categoryFeedback.originalValue}`);
  console.log(`Corrected category: ${categoryFeedback.correctedValue}`);
  
  console.log('\nTest Case 3: Store vendor feedback');
  const vendorFeedback = storeVendorFeedback(
    userId,
    invoiceId,
    'Amazn',
    'Amazon'
  );
  
  console.log(`Vendor feedback stored: ${vendorFeedback ? 'YES' : 'NO'}`);
  console.log(`Feedback type: ${vendorFeedback.feedbackType}`);
  console.log(`Original vendor: ${vendorFeedback.originalValue}`);
  console.log(`Corrected vendor: ${vendorFeedback.correctedValue}`);
  
  console.log('\nTest Case 4: Store attribute feedback');
  const attributeFeedback = storeAttributeFeedback(
    userId,
    invoiceId,
    'Laptop Dell XPS',
    'color',
    'black',
    'silver'
  );
  
  console.log(`Attribute feedback stored: ${attributeFeedback ? 'YES' : 'NO'}`);
  console.log(`Feedback type: ${attributeFeedback.feedbackType}`);
  console.log(`Field: ${attributeFeedback.field}`);
  console.log(`Item description: ${attributeFeedback.itemDescription}`);
  console.log(`Original value: ${attributeFeedback.originalValue}`);
  console.log(`Corrected value: ${attributeFeedback.correctedValue}`);
  
  const feedbackCount = mockDb.aiFeedback.length;
  console.log(`\nTotal feedback entries: ${feedbackCount}`);
  
  return feedbackCount === 4;
}

function testPersonalizedCategorySuggestions() {
  console.log('\n=== Testing Personalized Category Suggestions ===');
  
  const userId = 'user-1';
  const baseCategories = [
    'Office Supplies',
    'Travel',
    'Meals',
    'Entertainment',
    'Rent',
    'Utilities',
    'Insurance',
    'Taxes',
    'Marketing',
    'Software'
  ];
  
  console.log('\nStoring category feedback for Amazon:');
  storeCategoryFeedback(userId, 'inv-1', 'Office Supplies', 'Electronics', 'Amazon');
  storeCategoryFeedback(userId, 'inv-2', 'Software', 'Electronics', 'Amazon');
  storeCategoryFeedback(userId, 'inv-1', 'Marketing', 'IT Expenses', 'Amazon');
  
  console.log('Storing category feedback for Staples:');
  storeCategoryFeedback(userId, 'inv-2', 'Travel', 'Office Supplies', 'Staples');
  
  console.log('Storing category feedback for different user:');
  storeCategoryFeedback('user-2', 'inv-3', 'Entertainment', 'Software', 'Amazon');
  
  console.log('\nGetting personalized category suggestions for user-1 and Amazon:');
  const amazonSuggestions = getPersonalizedCategorySuggestions(
    userId,
    'Amazon',
    { vendorName: 'Amazon' },
    baseCategories
  );
  
  console.log('Personalized Amazon categories:');
  amazonSuggestions.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });
  
  const electronicsIndex = amazonSuggestions.indexOf('Electronics');
  const itExpensesIndex = amazonSuggestions.indexOf('IT Expenses');
  
  console.log(`\nElectronics position: ${electronicsIndex}`);
  console.log(`IT Expenses position: ${itExpensesIndex}`);
  
  const amazonCorrect = electronicsIndex === 0 && itExpensesIndex === 1;
  console.log(`Amazon suggestions correct: ${amazonCorrect ? 'YES' : 'NO'}`);
  
  console.log('\nGetting personalized category suggestions for user-1 and Staples:');
  const staplesSuggestions = getPersonalizedCategorySuggestions(
    userId,
    'Staples',
    { vendorName: 'Staples' },
    baseCategories
  );
  
  console.log('Personalized Staples categories:');
  staplesSuggestions.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });
  
  const officeSuppliesIndex = staplesSuggestions.indexOf('Office Supplies');
  
  console.log(`\nOffice Supplies position: ${officeSuppliesIndex}`);
  
  const staplesCorrect = officeSuppliesIndex === 0;
  console.log(`Staples suggestions correct: ${staplesCorrect ? 'YES' : 'NO'}`);
  
  console.log('\nGetting personalized category suggestions for user-2 and Amazon:');
  const user2Suggestions = getPersonalizedCategorySuggestions(
    'user-2',
    'Amazon',
    { vendorName: 'Amazon' },
    baseCategories
  );
  
  console.log('Personalized categories for user-2:');
  user2Suggestions.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });
  
  const softwareIndex = user2Suggestions.indexOf('Software');
  
  console.log(`\nSoftware position: ${softwareIndex}`);
  
  const user2Correct = softwareIndex === 0;
  console.log(`User-2 suggestions correct: ${user2Correct ? 'YES' : 'NO'}`);
  
  return amazonCorrect && staplesCorrect && user2Correct;
}

function testPersonalizedVendorSuggestions() {
  console.log('\n=== Testing Personalized Vendor Suggestions ===');
  
  const userId = 'user-1';
  const existingVendors = [
    'Amazon',
    'Staples',
    'Microsoft',
    'Dell',
    'Apple',
    'Uber',
    'Lyft',
    'Airbnb'
  ];
  
  console.log('\nStoring vendor feedback:');
  storeVendorFeedback(userId, 'inv-1', 'Amzn', 'Amazon');
  storeVendorFeedback(userId, 'inv-2', 'Microsft', 'Microsoft');
  storeVendorFeedback(userId, 'inv-1', 'Digi Ocean', 'DigitalOcean');
  
  console.log('Storing vendor feedback for different user:');
  storeVendorFeedback('user-2', 'inv-3', 'Appel', 'Apple');
  
  console.log('\nGetting personalized vendor suggestions for user-1:');
  const vendorSuggestions = getPersonalizedVendorSuggestions(
    userId,
    'Amaz',
    existingVendors
  );
  
  console.log('Personalized vendor suggestions:');
  vendorSuggestions.forEach((vendor, index) => {
    console.log(`${index + 1}. ${vendor}`);
  });
  
  const amazonIndex = vendorSuggestions.indexOf('Amazon');
  const digitalOceanIndex = vendorSuggestions.indexOf('DigitalOcean');
  
  console.log(`\nAmazon position: ${amazonIndex}`);
  console.log(`DigitalOcean position: ${digitalOceanIndex}`);
  
  const amazonCorrect = amazonIndex === 0;
  console.log(`Amazon prioritization correct: ${amazonCorrect ? 'YES' : 'NO'}`);
  
  console.log('\nGetting personalized vendor suggestions for user-2:');
  const user2Suggestions = getPersonalizedVendorSuggestions(
    'user-2',
    'App',
    existingVendors
  );
  
  console.log('Personalized vendor suggestions for user-2:');
  user2Suggestions.forEach((vendor, index) => {
    console.log(`${index + 1}. ${vendor}`);
  });
  
  const appleIndex = user2Suggestions.indexOf('Apple');
  
  console.log(`\nApple position: ${appleIndex}`);
  
  const user2Correct = appleIndex === 0;
  console.log(`User-2 suggestions correct: ${user2Correct ? 'YES' : 'NO'}`);
  
  return amazonCorrect && user2Correct;
}

function testAILearningOverTime() {
  console.log('\n=== Testing AI Learning Over Time ===');
  
  const userId = 'user-1';
  const baseCategories = [
    'Office Supplies',
    'Travel',
    'Meals',
    'Entertainment',
    'Rent',
    'Utilities',
    'Insurance',
    'Taxes',
    'Marketing',
    'Software'
  ];
  
  mockDb.aiFeedback = [];
  
  console.log('\nInitial category suggestions without feedback:');
  const initialSuggestions = getPersonalizedCategorySuggestions(
    userId,
    'Amazon',
    { vendorName: 'Amazon' },
    baseCategories
  );
  
  console.log('Initial suggestions:');
  initialSuggestions.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });
  
  console.log('\nProviding first feedback:');
  storeCategoryFeedback(userId, 'inv-1', 'Office Supplies', 'Electronics', 'Amazon');
  
  console.log('\nSuggestions after first feedback:');
  const firstFeedbackSuggestions = getPersonalizedCategorySuggestions(
    userId,
    'Amazon',
    { vendorName: 'Amazon' },
    baseCategories
  );
  
  console.log('Updated suggestions:');
  firstFeedbackSuggestions.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });
  
  const electronicsFirstIndex = firstFeedbackSuggestions.indexOf('Electronics');
  console.log(`\nElectronics position after first feedback: ${electronicsFirstIndex}`);
  
  console.log('\nProviding second feedback:');
  storeCategoryFeedback(userId, 'inv-2', 'Travel', 'IT Expenses', 'Amazon');
  
  console.log('\nSuggestions after second feedback:');
  const secondFeedbackSuggestions = getPersonalizedCategorySuggestions(
    userId,
    'Amazon',
    { vendorName: 'Amazon' },
    baseCategories
  );
  
  console.log('Updated suggestions:');
  secondFeedbackSuggestions.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });
  
  const electronicsSecondIndex = secondFeedbackSuggestions.indexOf('Electronics');
  const itExpensesIndex = secondFeedbackSuggestions.indexOf('IT Expenses');
  
  console.log(`\nElectronics position after second feedback: ${electronicsSecondIndex}`);
  console.log(`IT Expenses position after second feedback: ${itExpensesIndex}`);
  
  console.log('\nProviding third feedback (reinforcing Electronics):');
  storeCategoryFeedback(userId, 'inv-3', 'Software', 'Electronics', 'Amazon');
  
  console.log('\nSuggestions after third feedback:');
  const thirdFeedbackSuggestions = getPersonalizedCategorySuggestions(
    userId,
    'Amazon',
    { vendorName: 'Amazon' },
    baseCategories
  );
  
  console.log('Updated suggestions:');
  thirdFeedbackSuggestions.forEach((category, index) => {
    console.log(`${index + 1}. ${category}`);
  });
  
  const electronicsThirdIndex = thirdFeedbackSuggestions.indexOf('Electronics');
  const itExpensesThirdIndex = thirdFeedbackSuggestions.indexOf('IT Expenses');
  
  console.log(`\nElectronics position after third feedback: ${electronicsThirdIndex}`);
  console.log(`IT Expenses position after third feedback: ${itExpensesThirdIndex}`);
  
  const learningCorrect = 
    electronicsFirstIndex === 0 && 
    electronicsSecondIndex === 0 && 
    itExpensesIndex === 1 &&
    electronicsThirdIndex === 0 &&
    itExpensesThirdIndex === 1;
  
  console.log(`\nAI learning over time correct: ${learningCorrect ? 'YES' : 'NO'}`);
  
  return learningCorrect;
}

function runTests() {
  console.log('=== TESTING AI LEARNING WITH USER FEEDBACK ===\n');
  
  const storeFeedbackResult = testStoreFeedback();
  const categorySuggestionsResult = testPersonalizedCategorySuggestions();
  const vendorSuggestionsResult = testPersonalizedVendorSuggestions();
  const learningOverTimeResult = testAILearningOverTime();
  
  console.log('\n=== TEST RESULTS ===');
  console.log(`Store feedback: ${storeFeedbackResult ? 'PASS' : 'FAIL'}`);
  console.log(`Personalized category suggestions: ${categorySuggestionsResult ? 'PASS' : 'FAIL'}`);
  console.log(`Personalized vendor suggestions: ${vendorSuggestionsResult ? 'PASS' : 'FAIL'}`);
  console.log(`AI learning over time: ${learningOverTimeResult ? 'PASS' : 'FAIL'}`);
  
  const allTestsPassed = 
    storeFeedbackResult && 
    categorySuggestionsResult && 
    vendorSuggestionsResult &&
    learningOverTimeResult;
  
  console.log(`\nOverall result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return allTestsPassed;
}

try {
  const result = runTests();
  console.log(`\nTest execution ${result ? 'successful' : 'failed'}`);
} catch (error) {
  console.error('Error running AI learning tests:', error);
}
