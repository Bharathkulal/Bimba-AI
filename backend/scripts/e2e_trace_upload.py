import requests
import time

BASE = 'http://localhost:8000/api'
LOGIN = f'{BASE}/auth/login'
UPLOAD = f'{BASE}/resume-studio/upload'
PROFILE = f'{BASE}/resume-studio/profile'

roll = 'BCA24001'
password = '15-08-2005'
file_path = 'backend/test_resumes/labeled.txt'

s = requests.Session()
print('Logging in...')
res = s.post(LOGIN, json={'roll_number': roll, 'password': password})
print('Login status:', res.status_code)
print(res.text)
if res.status_code != 200:
    raise SystemExit('Login failed')

token = res.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

print('Uploading file...')
with open(file_path, 'rb') as f:
    files = {'file': (file_path, f)}
    up = s.post(UPLOAD, headers=headers, files=files, timeout=180)

print('Upload status:', up.status_code)
try:
    print(up.json())
except Exception as e:
    print('Upload response not JSON:', up.text)

resume_id = None
if up.status_code == 200:
    try:
        resume_id = up.json().get('resume_id')
    except Exception:
        pass

if resume_id:
    time.sleep(1)
    print('\nFetching profile...')
    p = s.get(f'{PROFILE}/{resume_id}', headers=headers)
    print('Profile status:', p.status_code)
    try:
        print(p.json())
    except Exception:
        print('Profile response not JSON:', p.text)
else:
    print('No resume_id returned; skipping profile fetch')
