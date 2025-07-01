#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// List of API routes to update
const apiRoutes = [
  'src/app/api/search/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/reports/leads/route.ts',
  'src/app/api/reports/shipping/route.ts',
  'src/app/api/reports/leads/period/route.ts',
  'src/app/api/reports/leads/daily/route.ts',
  'src/app/api/reports/sales/route.ts',
  'src/app/api/reports/sales/daily/route.ts',
  'src/app/api/reports/sales/period/route.ts',
  'src/app/api/reports/products/route.ts',
  'src/app/api/products/bulk/export/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/inventory/low-stock/route.ts',
  'src/app/api/orders/route.ts',
  'src/app/api/leads/route.ts',
  'src/app/api/cron/tracking-updates/route.ts',
  'src/app/api/shipping/locations/districts/route.ts',
  'src/app/api/shipping/locations/cities/route.ts'
];

// Add dynamic directive to each file
apiRoutes.forEach(routePath => {
  const fullPath = path.join(__dirname, routePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check if dynamic directive already exists
      if (!content.includes("export const dynamic = 'force-dynamic'")) {
        // Find the end of imports
        const lines = content.split('\n');
        let lastImportLine = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            lastImportLine = i;
          }
        }
        
        // Insert dynamic directive after imports
        if (lastImportLine >= 0) {
          lines.splice(lastImportLine + 1, 0, '', '// Force dynamic rendering for this route', "export const dynamic = 'force-dynamic';");
          content = lines.join('\n');
          fs.writeFileSync(fullPath, content);
          console.log(`✅ Updated ${routePath}`);
        } else {
          // If no imports, add at the beginning
          content = "// Force dynamic rendering for this route\nexport const dynamic = 'force-dynamic';\n\n" + content;
          fs.writeFileSync(fullPath, content);
          console.log(`✅ Updated ${routePath}`);
        }
      } else {
        console.log(`⏭️ Skipped ${routePath} (already has dynamic directive)`);
      }
    } else {
      console.log(`❌ Error: File not found: ${routePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${routePath}:`, error);
  }
});

console.log('\n🎉 All API routes updated successfully!'); 