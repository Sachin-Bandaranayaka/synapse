// Direct test of Royal Express provider without API endpoint
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testRoyalExpressDirect() {
  try {
    console.log('\n============================================');
    console.log('🚚 ROYAL EXPRESS DIRECT INTEGRATION TEST');
    console.log('============================================\n');

    // Get tenant credentials
    console.log('⏳ Fetching tenant credentials...');
    const tenant = await prisma.tenant.findFirst();

    console.log('📋 Tenant found:', {
      id: tenant?.id,
      name: tenant?.name,
      royalExpressApiKey: tenant?.royalExpressApiKey ? 'SET' : 'NOT SET'
    });

    if (!tenant || !tenant.royalExpressApiKey) {
      console.error('❌ No Royal Express API key found in tenant configuration');
      
      // Try to set it manually for testing
      console.log('⏳ Setting Royal Express credentials for testing...');
      const updatedTenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          royalExpressApiKey: 'janithbh123@gmail.com:905611623'
        }
      });
      console.log('✅ Royal Express API key set:', updatedTenant.royalExpressApiKey);
    }

    // Test the credentials format
    const apiKey = tenant?.royalExpressApiKey || 'janithbh123@gmail.com:905611623';
    const [email, password] = apiKey.split(':');
    
    console.log('\n📋 Testing credentials format:');
    console.log('Email:', email);
    console.log('Password:', password ? '***' : 'NOT SET');
    
    if (!email || !password) {
      console.error('❌ Invalid API key format. Expected email:password');
      process.exit(1);
    }

    // Test direct API call to Royal Express
    console.log('\n⏳ Testing direct API authentication...');
    
    // Try different tenant values
     const tenants = ['royalexpress', 'royal', 'curfox', 'developers'];
     let authData = null;
     let successfulTenant = null;
     
     for (const tenantName of tenants) {
       console.log(`\n⏳ Trying tenant: ${tenantName}`);
       
       const authResponse = await fetch('https://v1.api.curfox.com/api/public/merchant/login', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Accept': 'application/json',
           'X-tenant': tenantName,
         },
         body: JSON.stringify({
           email: email,
           password: password
         }),
       });

       console.log(`📋 Auth response status for ${tenantName}:`, authResponse.status);
       
       if (authResponse.ok) {
         const responseData = await authResponse.json();
         if (responseData.message === 'success' && responseData.token) {
           console.log(`✅ Authentication successful with tenant: ${tenantName}`);
           authData = responseData;
           successfulTenant = tenantName;
           break;
         }
       } else {
         const errorText = await authResponse.text();
         console.log(`❌ Failed with ${tenantName}:`, errorText);
       }
     }
     
     if (!authData) {
       console.error('❌ Authentication failed with all tenant values');
       process.exit(1);
     }
     
     console.log('\n✅ Authentication successful!');
     console.log('📋 Successful tenant:', successfulTenant);
     console.log('📋 Auth response:', {
       message: authData.message,
       token: authData.token ? 'RECEIVED' : 'NOT RECEIVED'
     });

    // Test getting user info
    if (authData.token) {
      console.log('\n⏳ Testing user info retrieval...');
      
      const userResponse = await fetch('https://v1.api.curfox.com/api/public/merchant/user/get-current', {
         method: 'GET',
         headers: {
           'Content-Type': 'application/json',
           'Accept': 'application/json',
           'X-tenant': successfulTenant,
           'Authorization': `Bearer ${authData.token}`,
         },
       });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ User info retrieved successfully!');
        console.log('📋 User data:', JSON.stringify(userData, null, 2));
      } else {
        const errorText = await userResponse.text();
        console.error('❌ Failed to get user info:', errorText);
      }
    }

    console.log('\n============================================');
    console.log('🎉 SUCCESS - Royal Express integration working!');
    console.log('============================================\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('❌ Error:', error.message);
    console.error('\n============================================');
    console.error('❌ FAILED - Integration test failed');
    console.error('============================================\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRoyalExpressDirect();