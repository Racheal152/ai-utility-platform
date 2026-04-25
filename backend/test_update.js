const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/users/4',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    // We need an auth token to hit this endpoint... wait.
  }
});
