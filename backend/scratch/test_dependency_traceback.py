import sys
import os
import traceback
from fastapi import Request
from pymongo import MongoClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.analytics import get_current_student
from app.models.student import Student

class MockRequest:
    def __init__(self, token):
        self.query_params = {"token": token}

def run_test():
    client = MongoClient("mongodb://localhost:27017")
    db = client.bimba_ai
    
    # Let's get the token
    login_url = "http://127.0.0.1:8000/api/auth/login"
    import requests
    r_login = requests.post(login_url, json={"roll_number": "BCA25001", "password": "24-11-2007"})
    token = r_login.json()["access_token"]
    print("Token:", token)
    
    req = MockRequest(token)
    try:
        student = get_current_student(req, token=token, db=db)
        print("Success! Student resolved:", student)
    except Exception as e:
        print("Exception in dependency:")
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
