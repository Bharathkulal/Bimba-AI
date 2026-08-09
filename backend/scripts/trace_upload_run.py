import os
import json
from types import SimpleNamespace

from app.services.upload_service import UploadService

# Load test resume text
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
resume_path = os.path.join(base, 'test_resumes', 'labeled.txt')
with open(resume_path, 'rb') as f:
    content = f.read()

# Create a fake DB with required attributes to avoid real DB writes
class FakeCollection:
    def update_one(self, *a, **k):
        print('[FAKE DB] update_one called', a, k)
    def insert_one(self, *a, **k):
        print('[FAKE DB] insert_one called', a, k)

class FakeDB:
    def __init__(self):
        self.resume_profiles = FakeCollection()
        self.client = SimpleNamespace(admin=SimpleNamespace(command=lambda *a, **k: True))

fake_db = FakeDB()
service = UploadService(fake_db)

# Patch repository.save_parsed_resume to avoid Mongo dependency
service.repository.save_parsed_resume = lambda student_id, parsed_data, filepath, cloudinary_url=None, public_id=None, raw_extraction_data=None: 999

res = service.process_upload(content, 'labeled.txt', 1)
print('\n=== PROCESS UPLOAD RESULT ===')
print(json.dumps(res, indent=2, default=str))
