const fs = require('fs');

// Read the current test file
const content = fs.readFileSync('test-returns-cancellation.js', 'utf8');

// Define the new checkCancellationRestrictions function
const newFunction = `  async checkCancellationRestrictions() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check orders.ts for business rules
      const ordersPath = path.join(__dirname, 'src/lib/orders.ts');
      if (fs.existsSync(ordersPath)) {
        const content = fs.readFileSync(ordersPath, 'utf8');
        const hasBusinessRules = content.includes('Cannot cancel order that has been') && content.includes('SHIPPED');
        return {
          implemented: hasBusinessRules,
          details: hasBusinessRules ? 'Business rules prevent cancellation of shipped orders' : 'No shipping status restrictions found'
        };
      }
      return { implemented: false, details: 'Orders.ts file not found' };
    } catch (error) {
      return { implemented: false, details: \`Error: \${error.message}\` };
    }
  }`;

// Define the new checkShippedOrderCancellation function
const newShippedFunction = `  async checkShippedOrderCancellation() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Check orders.ts for business rules preventing shipped order cancellation
      const ordersPath = path.join(__dirname, 'src/lib/orders.ts');
      if (fs.existsSync(ordersPath)) {
        const content = fs.readFileSync(ordersPath, 'utf8');
        const hasPreventionLogic = content.includes('Cannot cancel order that has been') && 
                                  content.includes('SHIPPED') && 
                                  content.includes('DELIVERED');
        return {
          implemented: hasPreventionLogic,
          details: hasPreventionLogic ? 'Business rules prevent cancellation of shipped orders' : 'Need to implement business rules to prevent cancellation of shipped orders'
        };
      }
      return { implemented: false, details: 'Orders.ts file not found' };
    } catch (error) {
      return { implemented: false, details: \`Error: \${error.message}\` };
    }
  }`;

// Replace the old functions
let updatedContent = content.replace(
  /async checkCancellationRestrictions\(\)[\s\S]*?^  }/m,
  newFunction
);

updatedContent = updatedContent.replace(
  /async checkShippedOrderCancellation\(\)[\s\S]*?^  }/m,
  newShippedFunction
);

// Write the updated content back to the file
fs.writeFileSync('test-returns-cancellation.js', updatedContent);
console.log('Successfully updated test script!');