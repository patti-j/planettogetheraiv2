const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/toc/drums',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer user_1_1754499148665',
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Response is valid JSON');
      console.log('Number of drums:', json.length);
      if (json.length > 0) {
        console.log('First drum:', JSON.stringify(json[0], null, 2));
      }
    } catch (e) {
      console.log('Response is not JSON. First 200 chars:');
      console.log(data.substring(0, 200));
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
