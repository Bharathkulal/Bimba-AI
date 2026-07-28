"""
Bimba AI - Cloudinary Integration Self-Test
============================================
Run: python scripts/test_cloudinary.py
Verifies: credentials, SDK init, upload, delete, MongoDB storage, download URL.
"""

import os
import sys

# Ensure project root is on the path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import requests
import cloudinary
import cloudinary.uploader
from datetime import datetime, timezone

# -- Helpers --

PASS = "[PASS]"
FAIL = "[FAIL]"
results = []

def record(label, passed, detail=""):
    results.append((label, passed, detail))
    icon = PASS if passed else FAIL
    msg = f"  {icon} {label}"
    if detail:
        msg += f"  ({detail})"
    print(msg)

# -- Step 1: Credentials loaded --

print("")
print("=" * 50)
print("  Bimba AI - Cloudinary Verification Report")
print("=" * 50)
print("")

cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "")
api_key    = os.getenv("CLOUDINARY_API_KEY", "")
api_secret = os.getenv("CLOUDINARY_API_SECRET", "")

record("CLOUDINARY_CLOUD_NAME loaded", bool(cloud_name), cloud_name if cloud_name else "MISSING")
record("CLOUDINARY_API_KEY loaded",    bool(api_key),    (api_key[:6] + "...") if api_key else "MISSING")
record("CLOUDINARY_API_SECRET loaded", bool(api_secret), "***" if api_secret else "MISSING")

if not (cloud_name and api_key and api_secret):
    print("")
    print("  Cannot continue - credentials are incomplete.")
    print("")
    sys.exit(1)

# -- Step 2: SDK initialisation --

try:
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
    record("Cloudinary SDK initialized", True)
except Exception as e:
    record("Cloudinary SDK initialized", False, str(e))
    sys.exit(1)

# -- Step 3: Upload a small test file --

test_content = b"Bimba AI Cloudinary integration test file - " + datetime.now(timezone.utc).isoformat().encode()
public_id = None
secure_url = None

try:
    upload_result = cloudinary.uploader.upload(
        test_content,
        folder="bimba-ai/self-test",
        resource_type="raw",
        public_id="selftest_" + str(int(datetime.now(timezone.utc).timestamp())),
    )
    public_id  = upload_result.get("public_id")
    secure_url = upload_result.get("secure_url") or upload_result.get("url")
    record("Upload works", True, "public_id=" + str(public_id))
except Exception as e:
    record("Upload works", False, str(e))

# -- Step 4: Download URL accessible --

if secure_url:
    try:
        resp = requests.get(secure_url, timeout=10)
        record("Download URL accessible", resp.status_code == 200, "HTTP " + str(resp.status_code))
    except Exception as e:
        record("Download URL accessible", False, str(e))
else:
    record("Download URL accessible", False, "No URL from upload")

# -- Step 5: MongoDB stores URL (simulated) --

try:
    from pymongo import MongoClient
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name   = os.getenv("DATABASE_NAME", "bimba_ai")
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
    db = client[db_name]

    # Write a test document
    test_doc = {
        "_selftest": True,
        "resume": {
            "cloudinary": {
                "public_id": public_id or "test",
                "url": secure_url or "https://example.com",
                "resource_type": "raw",
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "folder": "self-test",
            }
        },
    }
    insert_result = db.cloudinary_selftest.insert_one(test_doc)
    fetched = db.cloudinary_selftest.find_one({"_id": insert_result.inserted_id})
    stored_url = fetched.get("resume", {}).get("cloudinary", {}).get("url", "")
    display_url = stored_url[:60] + "..." if len(stored_url) > 60 else stored_url
    record("MongoDB stores URL", bool(stored_url), display_url)

    # Clean up test document
    db.cloudinary_selftest.delete_one({"_id": insert_result.inserted_id})
except Exception as e:
    record("MongoDB stores URL", False, str(e))

# -- Step 6: Delete works --

if public_id:
    try:
        del_result = cloudinary.uploader.destroy(public_id, resource_type="raw")
        ok = del_result.get("result") == "ok"
        record("Delete works", ok, "result=" + str(del_result.get("result")))
    except Exception as e:
        record("Delete works", False, str(e))
else:
    record("Delete works", False, "No public_id to delete")

# -- Summary --

print("")
print("-" * 50)
passed = sum(1 for _, p, _ in results if p)
total  = len(results)
print("  Result:  %d/%d checks passed" % (passed, total))
if passed == total:
    print("  Status:  ALL CHECKS PASSED")
else:
    print("  Status:  SOME CHECKS FAILED")
print("-" * 50)
print("")

sys.exit(0 if passed == total else 1)
