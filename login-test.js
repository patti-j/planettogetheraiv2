// Quick login script for testing
const loginData = {
  username: 'admin',
  password: 'admin123'
};

// Perform login
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(loginData),
})
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      console.log('Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
      
      // Store token in localStorage
      console.log('Execute this in the browser console:');
      console.log(`localStorage.setItem('auth_token', '${data.token}')`);
      console.log('Then navigate to: http://localhost:5000/paginated-reports');
    } else {
      console.error('Login failed:', data.error);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });