from pymongo import MongoClient
import os
from dotenv import load_dotenv

dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path)

mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
db_name = os.getenv("DATABASE_NAME", "bimba_ai")

client = MongoClient(mongo_uri)
db = client[db_name]

print("--- AI Providers in DB ---")
for p in db.ai_providers.find({}):
    print(f"Provider: {p.get('provider_name')} | Slug: {p.get('slug')} | Model: {p.get('model_name')} | Enabled: {p.get('is_enabled')}")

# Auto-update decommissioned models in DB if they exist
res = db.ai_providers.update_many(
    {"slug": "gemini", "model_name": "gemini-1.5-flash"},
    {"$set": {"model_name": "gemini-2.0-flash"}}
)
if res.modified_count > 0:
    print(f"Updated {res.modified_count} gemini provider models to gemini-2.0-flash")

res_or = db.ai_providers.update_many(
    {"slug": "openrouter", "model_name": "meta-llama/llama-3-8b-instruct:free"},
    {"$set": {"model_name": "meta-llama/llama-3.1-8b-instruct:free"}}
)
if res_or.modified_count > 0:
    print(f"Updated {res_or.modified_count} openrouter provider models to meta-llama/llama-3.1-8b-instruct:free")
