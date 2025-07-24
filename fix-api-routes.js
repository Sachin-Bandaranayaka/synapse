const fs = require('fs');
const path = require('path');

// List of files that need to be fixed
const filesToFix = [
  'src/app/api/orders/[orderId]/invoice/route.ts',
  'src/app/api/products/[productId]/route.ts',
  'src/app/api/orders/[orderId]/shipping/route.ts',
  'src/app/api/orders/[orderId]/return/route.ts',
  'src/app/api/orders/[orderId]/tracking/route.ts',
  'src/app/api/orders/[orderId]/invoice-print/route.ts',
  'src/app/api/products/[productId]/stock-history/route.ts',
  'src/app/api/orders/[orderId]/status/route.ts',
  'src/app/api/users/[id]/route.ts',
  'src/app/api/products/bulk/[operation]/route.ts'
];

console.log('🔧 Fixing TypeScript issues in API routes...');

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Fix params type patterns
  const patterns = [
    {
      from: /\{ params \}: \{ params: \{ ([^}]+) \} \}/g,
      to: '{ params }: { params: Promise<{ $1 }> }'
    }
  ];
  
  patterns.forEach(pattern => {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      modified = true;
    }
  });
  
  // Add await params resolution
  if (modified) {
    // Find function bodies and add params resolution
    const functionPatterns = [
      {
        from: /(export async function \w+\([^)]+\) \{[^}]*?)(const|let|var|\s+)(.*?params\.[\w]+)/g,
        to: (match, funcStart, varType, paramsUsage) => {
          if (funcStart.includes('const resolvedParams = await params;')) {
            return match;
          }
          const insertion = funcStart + '\n    const resolvedParams = await params;\n    ' + varType;
          return insertion + paramsUsage.replace(/params\./g, 'resolvedParams.');
        }
      }
    ];
    
    // Simple approach: replace params. with resolvedParams. and add resolution
    if (content.includes('params.') && !content.includes('resolvedParams')) {
      // Add params resolution after try {
      content = content.replace(
        /(try \{\s*)/g,
        '$1\n    const resolvedParams = await params;'
      );
      
      // Replace params. with resolvedParams.
      content = content.replace(/params\./g, 'resolvedParams.');
    }
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
});

console.log('\n🎉 All API routes have been processed!');
console.log('\n🧪 Running build test...');

// Run build test
const { execSync } = require('child_process');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build successful! All TypeScript issues resolved.');
} catch (error) {
  console.log('❌ Build still has issues. Manual review may be needed.');
  console.log(error.stdout?.toString() || error.message);
}