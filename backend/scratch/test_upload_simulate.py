import os
import sys
import requests
import jwt
from datetime import datetime, timedelta, timezone

# Ensure project root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.core.config import settings

# Create access token for BCA24001
expire = datetime.now(timezone.utc) + timedelta(minutes=60)
to_encode = {"exp": expire, "sub": "BCA24001"}
token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

print(f"Generated Token: {token}")

url = "http://localhost:8000/api/resume-studio/upload"
headers = {
    "Authorization": f"Bearer {token}"
}

# Upload the file
filepath = os.path.join(os.path.dirname(__file__), "resume.txt")
with open(filepath, "rb") as f:
    files = {"file": ("resume.txt", f, "text/plain")}
    response = requests.post(url, headers=headers, files=files)

print("Response status code:", response.status_code)
try:
    print("Response JSON:", response.json())
except Exception as e:
    print("Response text:", response.text)
