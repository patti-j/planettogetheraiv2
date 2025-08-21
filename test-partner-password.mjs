import bcrypt from 'bcryptjs';

// Hash the password
const hash = await bcrypt.hash('Test123!', 10);
console.log("UPDATE external_users SET password_hash = '" + hash + "' WHERE email = 'supplier@acme.com';");
