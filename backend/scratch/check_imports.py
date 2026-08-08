import sys
import traceback

print("Testing config.py imports:")
try:
    from pydantic_settings import BaseSettings
    from pydantic import ConfigDict
    print("pydantic_settings/pydantic imports SUCCESS")
except Exception as e:
    print("pydantic_settings/pydantic imports FAILED:")
    traceback.print_exc()

print("\nTesting mongodb.py imports:")
try:
    from bson import ObjectId
    from pymongo import MongoClient, ASCENDING
    print("bson/pymongo imports SUCCESS")
except Exception as e:
    print("bson/pymongo imports FAILED:")
    traceback.print_exc()
