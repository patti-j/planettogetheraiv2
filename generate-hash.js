const bcrypt = require('bcryptjs');

// Generate hash for Test123!
bcrypt.hash('Test123!', 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Hash for Test123!:');
    console.log(hash);
  }
});