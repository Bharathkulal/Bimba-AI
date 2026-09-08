import os
import sys

sys.path.insert(0, os.path.abspath("."))
from dotenv import load_dotenv
load_dotenv(".env")

from app.database.session import get_db

db = next(get_db())

# Update Gemini and Groq in DB
db.ai_providers.update_one({'slug': 'gemini'}, {'$set': {'model_name': 'gemini-1.5-flash', 'priority': 2, 'timeout': 10, 'retry_attempts': 1}})
db.ai_providers.update_one({'slug': 'groq'}, {'$set': {'priority': 1, 'model_name': 'llama-3.3-70b-versatile', 'timeout': 12, 'retry_attempts': 2}})
db.ai_providers.update_one({'slug': 'openrouter'}, {'$set': {'priority': 3, 'timeout': 10, 'retry_attempts': 1}})

providers = list(db.ai_providers.find({}, {'provider_name': 1, 'slug': 1, 'priority': 1, 'model_name': 1, 'timeout': 1, 'retry_attempts': 1}))
print("Updated providers:", providers)
