#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_ROUTES_DIR = join(__dirname, 'src', 'app', 'api');

function findRouteFiles(dir) {
  const allFiles = [];
  
  function traverse(currentDir) {
    const files = readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = join(currentDir, file);
      const stat = statSync(filePath);
      
      if (stat.isDirectory()) {
        traverse(filePath);
      } else if (file === 'route.ts' || file === 'route.js') {
        allFiles.push(filePath);
      }
    }
  }
  
  traverse(dir);
  return allFiles;
}

function addDynamicDirective(filePath) {
  try {
    let content = readFileSync(filePath, 'utf-8');
    
    // Check if already has dynamic directive
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      console.log(`⏭️ Skipped ${filePath.replace(__dirname, '')} (already has dynamic directive)`);
      return true;
    }
    
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
      writeFileSync(filePath, content);
      console.log(`✅ Updated ${filePath.replace(__dirname, '')}`);
      return true;
    } else {
      // If no imports, add at the beginning
      content = "// Force dynamic rendering for this route\nexport const dynamic = 'force-dynamic';\n\n" + content;
      writeFileSync(filePath, content);
      console.log(`✅ Updated ${filePath.replace(__dirname, '')}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath.replace(__dirname, '')}:`, error);
    return false;
  }
}

// Find all route files
const routeFiles = findRouteFiles(API_ROUTES_DIR);
console.log(`Found ${routeFiles.length} route files`);

// Process each file
let updatedCount = 0;
let errorCount = 0;

for (const file of routeFiles) {
  const success = addDynamicDirective(file);
  if (success) {
    updatedCount++;
  } else {
    errorCount++;
  }
}

console.log('\n🎉 Summary:');
console.log(`Total Files: ${routeFiles.length}`);
console.log(`Successfully Updated/Skipped: ${updatedCount}`);
console.log(`Errors: ${errorCount}`);
console.log('\nRun "node verify-routes.mjs" to verify all routes have been updated.'); 