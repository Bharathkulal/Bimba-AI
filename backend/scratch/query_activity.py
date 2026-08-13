from pymongo import MongoClient
import pprint

client = MongoClient("mongodb://localhost:27017")
db = client["bimba_ai"]

logs = list(db.activity_logs.find({"student_id": 8}).limit(5))
print(f"Found {len(logs)} logs for student_id=8:")
for l in logs:
    pprint.pprint(l)
