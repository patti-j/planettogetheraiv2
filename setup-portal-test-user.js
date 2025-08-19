// Script to create a test user for the External Partners Portal
// Run this with: node setup-portal-test-user.js

const bcrypt = require('bcryptjs');
const { db } = require('./server/db');
const { externalCompanies, externalUsers } = require('./portal/shared/schema');

async function setupTestPortalAccess() {
  console.log('Setting up test portal access...\n');

  try {
    // Test credentials
    const testEmail = 'demo@supplier.com';
    const testPassword = 'Demo123!';
    const companyName = 'Demo Supplier Company';

    // Hash the password
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    // Create test company
    console.log('Creating test supplier company...');
    const [company] = await db.insert(externalCompanies).values({
      name: companyName,
      type: 'supplier',
      status: 'active',
      industry: 'manufacturing',
      size: 'medium',
      country: 'USA',
      city: 'New York',
      aiOnboardingComplete: true,
      enabledFeatures: {
        purchaseOrders: true,
        deliveryTracking: true,
        qualityDocs: true,
        analytics: true,
        aiAssistant: true
      }
    }).returning();

    console.log('✅ Company created:', company.name);
    console.log('   Company ID:', company.id);

    // Create test user
    console.log('\nCreating test user...');
    const [user] = await db.insert(externalUsers).values({
      email: testEmail,
      passwordHash: passwordHash,
      companyId: company.id,
      firstName: 'Demo',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
      isActive: true,
      permissions: {
        canViewOrders: true,
        canUpdateDeliveries: true,
        canUploadDocuments: true,
        canViewAnalytics: true
      },
      aiAssistanceLevel: 'proactive'
    }).returning();

    console.log('✅ User created:', user.email);
    console.log('   User ID:', user.id);

    // Output access instructions
    console.log('\n' + '='.repeat(60));
    console.log('PORTAL ACCESS CREDENTIALS');
    console.log('='.repeat(60));
    console.log('\n📍 Portal URL: http://localhost:5000/portal/login');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);
    console.log('\n🏢 Company Details:');
    console.log('   Name:', companyName);
    console.log('   Type: Supplier');
    console.log('   Status: Active');
    console.log('\n✨ Features Enabled:');
    console.log('   - Purchase Order Management');
    console.log('   - Delivery Tracking');
    console.log('   - Quality Documents');
    console.log('   - Performance Analytics');
    console.log('   - Max AI Assistant');
    console.log('\n' + '='.repeat(60));
    
    // Create some sample data for the test supplier
    console.log('\nCreating sample purchase orders...');
    
    // You can add sample purchase orders here if needed
    // This would require creating the purchase orders table first
    
    console.log('\n✅ Setup complete! You can now login to the portal.');
    console.log('\nNext steps:');
    console.log('1. Navigate to http://localhost:5000/portal/login');
    console.log('2. Login with the credentials above');
    console.log('3. Explore the supplier dashboard');
    console.log('4. Try the Max AI Assistant for help');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up portal access:', error);
    
    if (error.code === '23505') {
      console.error('\n⚠️  User or company already exists.');
      console.error('   Try logging in with existing credentials or use different email.');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupTestPortalAccess();