from pymongo import MongoClient
import os
from dotenv import load_dotenv

dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path)

mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
db_name = os.getenv("DATABASE_NAME", "bimba_ai")

client = MongoClient(mongo_uri)
db = client[db_name]

print("Updating AI Provider priorities in DB...")

# Update Gemini
res_gem = db.ai_providers.update_one(
    {"slug": "gemini"},
    {"$set": {"priority": 1}}
)

# Update Groq
res_groq = db.ai_providers.update_one(
    {"slug": "groq"},
    {"$set": {"priority": 2}}
)

# Update OpenRouter
res_or = db.ai_providers.update_one(
    {"slug": "openrouter"},
    {"$set": {"priority": 3}}
)

print(f"Gemini modified count: {res_gem.modified_count}")
print(f"Groq modified count: {res_groq.modified_count}")
print(f"OpenRouter modified count: {res_or.modified_count}")

print("\nVerify updated priority order:")
for p in db.ai_providers.find({}).sort("priority", 1):
    print(f"Priority: {p.get('priority')} | Provider: {p.get('provider_name')} | Slug: {p.get('slug')}")
