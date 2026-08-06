import sys
import os
import traceback

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import get_db
from app.services.upload_service import UploadService
from pymongo import MongoClient

def run_test():
    client = MongoClient("mongodb://localhost:27017")
    db = client.bimba_ai
    
    file_path = r"d:\Bimba AI\Minimalist Modern Simple Business Social Media Manager Resume.pdf"
    with open(file_path, "rb") as f:
        content = f.read()
        
    try:
        service = UploadService(db)
        # student_id 1 is ADITYA
        res = service.process_upload(content, "Minimalist Modern Simple Business Social Media Manager Resume.pdf", 1)
        print("Success:", res)
    except Exception as e:
        print("Exception caught:")
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
