const fs = require('fs');

// Read the current orders.ts file
const content = fs.readFileSync('src/lib/orders.ts', 'utf8');

// Define the new validation logic
const newValidationLogic = `    // Validate status transitions with comprehensive business rules
    const validTransitions = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'], // Cannot cancel shipped orders
      'DELIVERED': ['RETURNED'],
      'CANCELLED': [], // Cannot transition from cancelled
      'RETURNED': []   // Cannot transition from returned
    };
    
    const allowedStatuses = validTransitions[currentOrder.status as keyof typeof validTransitions];
    if (!allowedStatuses.includes(status)) {
      throw new Error(\`Invalid status transition from \${currentOrder.status} to \${status}\`);
    }
    
    // Business rule: Prevent cancellation of shipped, delivered, or returned orders
    if (status === OrderStatus.CANCELLED && 
        ['SHIPPED', 'DELIVERED', 'RETURNED'].includes(currentOrder.status)) {
      throw new Error(\`Cannot cancel order that has been \${currentOrder.status.toLowerCase()}. Please process a return instead.\`);
    }
    
    // Business rule: Only allow returns for delivered orders
    if (status === OrderStatus.RETURNED && currentOrder.status !== 'DELIVERED') {
      throw new Error(\`Can only return orders that have been delivered. Current status: \${currentOrder.status}\`);
    }`;

// Replace the old validation logic
const oldPattern = /\/\/ Validate status transitions[\s\S]*?throw new Error\(`Invalid status transition from \$\{currentOrder\.status\} to \$\{status\}`\);/;
const updatedContent = content.replace(oldPattern, newValidationLogic);

// Write the updated content back to the file
fs.writeFileSync('src/lib/orders.ts', updatedContent);
console.log('Successfully updated orders.ts with enhanced business logic!');