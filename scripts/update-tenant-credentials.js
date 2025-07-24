// Script to update tenant with Royal Express credentials for testing
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTenantCredentials() {
  try {
    console.log('Updating tenant with Royal Express credentials...');
    
    // Get the first tenant
    const tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      console.error('No tenant found!');
      return;
    }
    
    console.log('Found tenant:', tenant.name);
    
    // Update with Royal Express credentials
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        royalExpressApiKey: 'janithbh123@gmail.com:905611623',
        // Also add other credentials for testing
        fardaExpressClientId: '8590',
        fardaExpressApiKey: '2b932e8689a1687aad19',
        transExpressApiKey: 'test-api-key'
      }
    });
    
    console.log('Tenant updated successfully!');
    console.log('Royal Express API Key:', updatedTenant.royalExpressApiKey);
    console.log('Farda Express Client ID:', updatedTenant.fardaExpressClientId);
    console.log('Farda Express API Key:', updatedTenant.fardaExpressApiKey);
    console.log('Trans Express API Key:', updatedTenant.transExpressApiKey);
    
  } catch (error) {
    console.error('Error updating tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTenantCredentials();