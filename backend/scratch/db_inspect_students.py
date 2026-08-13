from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["bimba_ai"]

print("All Students:")
for s in db.students.find():
    print(f"ID: {s.get('id')} ({type(s.get('id'))}), Roll: {s.get('roll_number')}, Name: {s.get('student_name') or s.get('full_name')}, Email: {s.get('email')}")

print("\nActivity Logs counts by Student ID:")
for group in db.activity_logs.aggregate([{"$group": {"_id": "$student_id", "count": {"$sum": 1}}}]):
    print(f"Student ID: {group['_id']} ({type(group['_id'])}), Count: {group['count']}")
