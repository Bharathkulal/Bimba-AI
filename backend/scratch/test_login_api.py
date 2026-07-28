import requests

res = requests.post('http://localhost:8000/api/auth/login', json={'roll_number': 'BCA24001', 'password': '15-08-2005'})
print('Status Code:', res.status_code)
print('Response JSON:', res.json())
