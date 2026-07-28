const axios = require('axios');

axios.post('http://localhost:8000/api/auth/login', {
  roll_number: 'BCA24001',
  password: '15-08-2005'
}).then(res => {
  console.log('Success:', res.status, res.data);
}).catch(err => {
  console.error('Error:', err.response ? err.response.status : err.message, err.response ? err.response.data : '');
});
