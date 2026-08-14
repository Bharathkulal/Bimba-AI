from pymongo import MongoClient
import pprint

client = MongoClient("mongodb://localhost:27017")
db = client["bimba_ai"]

print("--- Students count by department ---")
for doc in db.students.aggregate([
    {"$group": {"_id": "$department", "count": {"$sum": 1}}}
]):
    print(doc)

print("\n--- Students count by placement_status ---")
for doc in db.students.aggregate([
    {"$group": {"_id": "$placement_status", "count": {"$sum": 1}}}
]):
    print(doc)

print("\n--- Placement drives ---")
print("Total drives:", db.placement_drives.count_documents({}))
for doc in db.placement_drives.find().limit(5):
    print(doc)

print("\n--- Placement applications status count ---")
for doc in db.placement_applications.aggregate([
    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
]):
    print(doc)

print("\n--- Example student document ---")
pprint.pprint(db.students.find_one())
