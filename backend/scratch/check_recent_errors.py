from pymongo import MongoClient
import pprint
from datetime import datetime, timedelta

client = MongoClient("mongodb://localhost:27017")
db = client["bimba_ai"]

print("--- Recent Audit Logs (Last 10) ---")
for log in db.audit_logs.find().sort("_id", -1).limit(10):
    pprint.pprint(log)

print("\n--- Recent AI Gateway Logs (Last 10) ---")
for log in db.ai_gateway_logs.find().sort("_id", -1).limit(10):
    pprint.pprint(log)

print("\n--- Recent System Settings ---")
pprint.pprint(db.ai_system_settings.find_one())
