const bcrypt = require('bcryptjs');

// Generate a proper hash for password123
const password = 'password123';
const saltRounds = 10;

const hash = bcrypt.hashSync(password, saltRounds);
console.log('New hash for password123:', hash);

// Test the hash
const isValid = bcrypt.compareSync('password123', hash);
console.log('Hash validation test:', isValid);

// Also test against the current hash
const currentHash = '$2b$10$5PJZvz8Xs2LmE2Smfphp3uW0IXsx9MDIG0U1ASANvWrLVq.KXjuG6';
const isCurrentValid = bcrypt.compareSync('password123', currentHash);
console.log('Current hash validation test:', isCurrentValid);