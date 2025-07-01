// This script tests the Royal Express (Curfox) integration
// Run with: node scripts/test-royal-express.js

// Use dynamic import for ESM compatibility
(async () => {
  try {
    // Load environment variables
    require('dotenv').config();

    console.log('\n============================================');
    console.log('🚚 ROYAL EXPRESS (CURFOX) INTEGRATION TEST');
    console.log('============================================\n');

    console.log('⏳ Loading test module...');
    
    // Since we can't directly require TypeScript files, we'll need to run this through the Next.js API
    const fetch = await import('node-fetch').then(mod => mod.default);
    
    // Get the base URL from arguments or use localhost
    const baseUrl = process.argv[2] || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/test/royal-express`;
    
    console.log(`🔗 Using API URL: ${apiUrl}`);
    console.log('\n⏳ Running test...\n');
    
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    if (response.ok && result.status === 'success') {
      console.log('✅ TEST PASSED!');
      console.log('✅ Royal Express (Curfox) integration is working correctly!\n');
      
      console.log('📋 User Information:');
      console.log(JSON.stringify(result.data, null, 2));
      
      console.log('\n============================================');
      console.log('🎉 SUCCESS - Integration test completed successfully');
      console.log('============================================\n');
      process.exit(0);
    } else {
      console.log('❌ TEST FAILED!');
      console.log(`❌ Error: ${result.message || 'Unknown error'}\n`);
      
      if (result.error) {
        console.log('📋 Error Details:');
        console.log(typeof result.error === 'string' ? result.error : JSON.stringify(result.error, null, 2));
      }
      
      console.log('\n============================================');
      console.log('❌ FAILED - Integration test failed');
      console.log('============================================\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ TEST ERROR:');
    console.error(error);
    console.log('\n============================================');
    console.log('❌ ERROR - Integration test encountered an error');
    console.log('============================================\n');
    process.exit(1);
  }
})(); 