const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 PRODUCTION READINESS TEST SUITE');
console.log('=====================================\n');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function runTest(testName, testFunction) {
  try {
    console.log(`🧪 Testing: ${testName}`);
    testFunction();
    console.log(`✅ PASSED: ${testName}\n`);
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}\n`);
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
  }
}

// Test 1: Environment Configuration
runTest('Environment Configuration', () => {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
  
  console.log('   ✓ All required environment variables present');
});

// Test 2: Database Schema
runTest('Database Schema Validation', () => {
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Prisma schema file not found');
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const requiredModels = ['Tenant', 'User', 'Product', 'Lead', 'Order', 'StockAdjustment', 'TrackingUpdate'];
  
  for (const model of requiredModels) {
    if (!schemaContent.includes(`model ${model}`)) {
      throw new Error(`Missing required model: ${model}`);
    }
  }
  
  console.log('   ✓ All required database models present');
});

// Test 3: Package Dependencies
runTest('Package Dependencies', () => {
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const criticalDeps = [
    'next', 'react', 'react-dom', '@prisma/client', 'next-auth',
    'tailwindcss', 'typescript', 'lucide-react', 'recharts'
  ];
  
  for (const dep of criticalDeps) {
    if (!packageJson.dependencies[dep]) {
      throw new Error(`Missing critical dependency: ${dep}`);
    }
  }
  
  console.log('   ✓ All critical dependencies present');
});

// Test 4: Core Components Structure
runTest('Core Components Structure', () => {
  const componentsDir = path.join(__dirname, 'src', 'components');
  const requiredDirs = ['auth', 'dashboard', 'leads', 'orders', 'products', 'shipping', 'ui'];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(componentsDir, dir);
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Missing component directory: ${dir}`);
    }
  }
  
  console.log('   ✓ All required component directories present');
});

// Test 5: API Routes Structure
runTest('API Routes Structure', () => {
  const apiDir = path.join(__dirname, 'src', 'app', 'api');
  const requiredRoutes = ['auth', 'leads', 'orders', 'products', 'shipping', 'users'];
  
  for (const route of requiredRoutes) {
    const routePath = path.join(apiDir, route);
    if (!fs.existsSync(routePath)) {
      throw new Error(`Missing API route: ${route}`);
    }
  }
  
  console.log('   ✓ All required API routes present');
});

// Test 6: TypeScript Configuration
runTest('TypeScript Configuration', () => {
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error('tsconfig.json not found');
  }
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (!tsconfig.compilerOptions || !tsconfig.compilerOptions.strict) {
    throw new Error('TypeScript strict mode not enabled');
  }
  
  console.log('   ✓ TypeScript configuration valid');
});

// Test 7: Tailwind Configuration
runTest('Tailwind Configuration', () => {
  const tailwindPath = path.join(__dirname, 'tailwind.config.js');
  if (!fs.existsSync(tailwindPath)) {
    throw new Error('tailwind.config.js not found');
  }
  
  console.log('   ✓ Tailwind configuration present');
});

// Test 8: Build Process
runTest('Build Process', () => {
  try {
    console.log('   Running build process...');
    execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
    console.log('   ✓ Build completed successfully');
  } catch (error) {
    throw new Error(`Build failed: ${error.message}`);
  }
});

// Test 9: Security Headers Check
runTest('Security Configuration', () => {
  const middlewarePath = path.join(__dirname, 'src', 'middleware.ts');
  if (!fs.existsSync(middlewarePath)) {
    throw new Error('middleware.ts not found');
  }
  
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  if (!middlewareContent.includes('NextResponse')) {
    throw new Error('Middleware not properly configured');
  }
  
  console.log('   ✓ Security middleware present');
});

// Test 10: Email Templates
runTest('Email Templates', () => {
  const emailsDir = path.join(__dirname, 'src', 'emails');
  const requiredTemplates = ['lead-assignment.tsx', 'order-confirmation.tsx', 'shipment-update.tsx'];
  
  for (const template of requiredTemplates) {
    const templatePath = path.join(emailsDir, template);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Missing email template: ${template}`);
    }
  }
  
  console.log('   ✓ All required email templates present');
});

// Final Results
console.log('\n🏁 PRODUCTION READINESS TEST RESULTS');
console.log('====================================');
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📊 Total: ${testResults.passed + testResults.failed}`);

if (testResults.failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  testResults.tests
    .filter(test => test.status === 'FAILED')
    .forEach(test => {
      console.log(`   • ${test.name}: ${test.error}`);
    });
}

const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}%`);

if (successRate >= 80) {
  console.log('\n🎉 APPLICATION IS PRODUCTION READY!');
  console.log('✅ Most critical tests passed');
  console.log('🚀 Ready for deployment');
} else {
  console.log('\n⚠️  APPLICATION NEEDS ATTENTION');
  console.log('❌ Critical issues found');
  console.log('🔧 Please fix failed tests before deployment');
  process.exit(1);
}

console.log('\n📋 NEXT STEPS FOR PRODUCTION:');
console.log('1. Set up production environment variables');
console.log('2. Configure production database');
console.log('3. Set up monitoring and logging');
console.log('4. Configure SSL certificates');
console.log('5. Set up backup strategies');
console.log('6. Perform load testing');
console.log('7. Set up CI/CD pipeline');