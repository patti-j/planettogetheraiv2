const bcrypt = require('bcryptjs');

// Generate a password hash for testing
const password = 'Test123!';
const hash = bcrypt.hashSync(password, 10);

console.log('Portal Test User Setup');
console.log('======================');
console.log('');
console.log('Since the external portal tables are not yet created,');
console.log('you can access the portal in development mode using:');
console.log('');
console.log('URL: http://localhost:5000/portal/login');
console.log('');
console.log('For testing, you can use the main application login:');
console.log('Email: patti.jorge@mfgco.com');
console.log('Password: admin123');
console.log('');
console.log('Or the admin account:');
console.log('Email: admin');
console.log('Password: admin123');
console.log('');
console.log('Note: The portal is designed for external partners (suppliers, customers, OEM partners)');
console.log('and requires separate database tables to be set up for production use.');
console.log('');
console.log('To fully set up the portal, the following tables need to be created:');
console.log('- external_companies');
console.log('- external_users');
console.log('- external_sessions');
console.log('');
console.log('Generated password hash for "Test123!": ', hash);