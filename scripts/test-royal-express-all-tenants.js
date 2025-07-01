// This script tests the Royal Express (Curfox) integration with different tenant names
// Run with: node scripts/test-royal-express-all-tenants.js

// Use dynamic import for ESM compatibility
(async () => {
  try {
    // Load environment variables
    require('dotenv').config();

    console.log('\n============================================');
    console.log('🚚 ROYAL EXPRESS (CURFOX) MULTI-TENANT TEST');
    console.log('============================================\n');

    // Define possible tenants to try
    const tenants = [
      'developers', // Default
      'royal',
      'curfox',
      'merchant',
      'manta',
      'express',
      'royalexpress',
      'royalexp',
      'courier',
      'royalcourier',
      'srilanka',
      'lk'
    ];

    console.log(`Will test with ${tenants.length} different tenant names\n`);
    
    // Since we can't directly require TypeScript files, we'll use fetch API
    const fetch = await import('node-fetch').then(mod => mod.default);
    
    // Get the base URL from arguments or use localhost
    const baseUrl = process.argv[2] || 'http://localhost:3000';
    
    // Array to collect results
    const results = [];
    let foundWorkingTenant = false;
    
    // Test each tenant
    for (const tenant of tenants) {
      const apiUrl = `${baseUrl}/api/test/royal-express?tenant=${tenant}`;
      
      console.log(`\n🔍 Testing with tenant: ${tenant}`);
      console.log(`🔗 Using API URL: ${apiUrl}`);
      
      try {
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        results.push({
          tenant,
          success: response.ok && result.status === 'success',
          message: result.status === 'success' ? 'SUCCESS' : 'FAILED',
          error: result.error || null
        });
        
        if (response.ok && result.status === 'success') {
          console.log('✅ TEST PASSED with tenant: ' + tenant);
          console.log('\n📋 User Information:');
          console.log(JSON.stringify(result.data, null, 2));
          foundWorkingTenant = true;
          break; // Stop on first success
        } else {
          console.log('❌ TEST FAILED with tenant: ' + tenant);
          console.log('📋 Error: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('❌ ERROR with tenant: ' + tenant);
        console.error(error.message);
        results.push({
          tenant,
          success: false,
          message: 'ERROR',
          error: error.message
        });
      }
      
      // Wait a bit between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n\n============================================');
    console.log('🔍 TEST RESULTS SUMMARY');
    console.log('============================================');
    
    if (foundWorkingTenant) {
      console.log('✅ FOUND WORKING TENANT! Check the results above.');
    } else {
      console.log('❌ No working tenant found. Test results:');
      results.forEach(result => {
        console.log(`- ${result.tenant}: ${result.message}${result.error ? ' - ' + result.error : ''}`);
      });
      
      console.log('\n⚠️ Suggestions:');
      console.log('1. Check if your account is active at https://developers.merchant.curfox.com');
      console.log('2. Try creating a new account');
      console.log('3. Contact Curfox support to reactivate your account');
    }
    
    console.log('\n============================================\n');
    
    process.exit(foundWorkingTenant ? 0 : 1);
  } catch (error) {
    console.error('\n❌ SCRIPT ERROR:');
    console.error(error);
    console.log('\n============================================');
    console.log('❌ ERROR - Script encountered an error');
    console.log('============================================\n');
    process.exit(1);
  }
})(); 