#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
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

function checkDynamicDirective(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const hasDynamicDirective = content.includes("export const dynamic = 'force-dynamic'");
    
    return {
      filePath: filePath.replace(__dirname, ''),
      hasDynamicDirective
    };
  } catch (error) {
    return {
      filePath: filePath.replace(__dirname, ''),
      hasDynamicDirective: false,
      error: error.message
    };
  }
}

// Find all route files
const routeFiles = findRouteFiles(API_ROUTES_DIR);
console.log(`Found ${routeFiles.length} route files`);

// Check each file for dynamic directive
const results = routeFiles.map(checkDynamicDirective);

// Show summary
const missingDynamic = results.filter(r => !r.hasDynamicDirective);

if (missingDynamic.length === 0) {
  console.log('✅ All API routes have the dynamic directive');
} else {
  console.log(`❌ ${missingDynamic.length} routes are missing the dynamic directive:`);
  missingDynamic.forEach(route => {
    console.log(`  - ${route.filePath}`);
  });
}

// Print all routes for reference
console.log('\nAll API routes:');
results.forEach(route => {
  const status = route.hasDynamicDirective ? '✅' : '❌';
  console.log(`${status} ${route.filePath}`);
}); 