import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.mongodb import db
from app.schemas.template import TemplateResponse

print("Fetching templates from DB...")
templates = list(db.resume_templates.find({}))
print(f"Found {len(templates)} templates.")

for idx, t in enumerate(templates):
    print(f"\n--- Template {idx}: {t.get('name')} (ID: {t.get('id') or t.get('_id')}) ---")
    try:
        from app.models.template import ResumeTemplate
        model_obj = ResumeTemplate(t)
        res = TemplateResponse.model_validate(model_obj)
        print("Validation: SUCCESS")
    except Exception as e:
        print("Validation: FAILED")
        import traceback
        traceback.print_exc()
