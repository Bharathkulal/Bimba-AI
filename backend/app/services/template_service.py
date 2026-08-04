from typing import List, Optional, Dict, Any
from datetime import datetime
from app.repositories.template_repository import TemplateRepository
from app.schemas.template import TemplateCreate, TemplateUpdate
from app.models.template import ResumeTemplate
from app.core.mongodb import db, get_next_sequence

class TemplateService:
    def __init__(self):
        self.repository = TemplateRepository()

    def list_templates(self, filters: Dict[str, Any] = None, search_query: str = None, skip: int = 0, limit: int = 100) -> List[ResumeTemplate]:
        return self.repository.list_templates(filters, search_query, skip, limit)

    def get_template_by_id(self, id_str: str) -> Optional[ResumeTemplate]:
        return self.repository.get_by_id(id_str)

    def create_template(self, payload: TemplateCreate) -> ResumeTemplate:
        data = payload.model_dump()
        data["usageCount"] = 0
        data["downloadCount"] = 0
        return self.repository.create(data)

    def update_template(self, id_str: str, payload: TemplateUpdate) -> Optional[ResumeTemplate]:
        data = payload.model_dump(exclude_unset=True)
        return self.repository.update(id_str, data)

    def delete_template(self, id_str: str) -> bool:
        return self.repository.delete(id_str)

    def reorder_templates(self, template_ids: List[str]) -> bool:
        return self.repository.reorder(template_ids)

    def enable_disable_templates(self, template_ids: List[str], enabled: bool) -> bool:
        return self.repository.enable_disable_bulk(template_ids, enabled)

    def get_categories(self) -> List[str]:
        return self.repository.get_categories()

    def track_selection(self, template_id: str, student_id: int, action: str = "select", selection_time: int = 0) -> bool:
        """
        Tracks student interaction with a template.
        action can be 'select' or 'download'
        """
        now = datetime.utcnow()
        # Find template to update counters
        template = self.repository.get_by_template_id(template_id)
        if not template:
            return False

        # Increment counts
        update_fields = {}
        if action == "select":
            update_fields["usageCount"] = template.get("usageCount", 0) + 1
        elif action == "download":
            update_fields["downloadCount"] = template.get("downloadCount", 0) + 1

        self.repository.collection.update_one(
            {"templateId": template_id},
            {"$set": update_fields}
        )

        # Insert log for deep analytics
        db.template_analytics_logs.insert_one({
            "id": get_next_sequence("template_analytics_logs"),
            "templateId": template_id,
            "category": template.get("category", "Professional"),
            "studentId": student_id,
            "action": action,
            "atsScore": template.get("atsScore", 80),
            "selectionTimeSeconds": selection_time,
            "createdAt": now
        })
        return True

    def get_analytics(self) -> Dict[str, Any]:
        """
        Get template dashboard analytics
        """
        total = self.repository.collection.count_documents({})
        enabled = self.repository.collection.count_documents({"enabled": True})
        disabled = self.repository.collection.count_documents({"enabled": False})
        featured = self.repository.collection.count_documents({"featured": True})
        premium = self.repository.collection.count_documents({"premium": True})

        # Calculate average ATS score
        avg_ats = 0.0
        pipeline = [{"$group": {"_id": None, "avg_ats": {"$avg": "$atsScore"}}}]
        ats_res = list(self.repository.collection.aggregate(pipeline))
        if ats_res and ats_res[0]["avg_ats"] is not None:
            avg_ats = round(ats_res[0]["avg_ats"], 1)

        # Most and least used
        most_used_cursor = self.repository.collection.find().sort("usageCount", -1).limit(5)
        least_used_cursor = self.repository.collection.find().sort("usageCount", 1).limit(5)

        most_used = [ResumeTemplate(doc) for doc in most_used_cursor]
        least_used = [ResumeTemplate(doc) for doc in least_used_cursor]

        # Category popularity (aggregate from logs or templates)
        cat_pop = list(db.template_analytics_logs.aggregate([
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        category_popularity = {item["_id"]: item["count"] for item in cat_pop if item["_id"]}

        # Downloads and PDF generations count from logs
        downloads_count = db.template_analytics_logs.count_documents({"action": "download"})
        selections_count = db.template_analytics_logs.count_documents({"action": "select"})

        # Average selection time
        avg_time = 0.0
        time_pipeline = [
            {"$match": {"action": "select", "selectionTimeSeconds": {"$gt": 0}}},
            {"$group": {"_id": None, "avg_time": {"$avg": "$selectionTimeSeconds"}}}
        ]
        time_res = list(db.template_analytics_logs.aggregate(time_pipeline))
        if time_res and time_res[0]["avg_time"] is not None:
            avg_time = round(time_res[0]["avg_time"], 1)

        # Recent updates
        recent_cursor = self.repository.collection.find().sort("updatedAt", -1).limit(5)
        recent_updates = [ResumeTemplate(doc) for doc in recent_cursor]

        return {
            "totalTemplates": total,
            "enabled": enabled,
            "disabled": disabled,
            "featured": featured,
            "premium": premium,
            "averageAtsScore": avg_ats,
            "downloads": downloads_count,
            "pdfGenerations": selections_count,
            "averageSelectionTime": avg_time,
            "mostUsed": most_used,
            "leastUsed": least_used,
            "categoryPopularity": category_popularity,
            "recentUpdates": recent_updates,
            "storageUsage": f"{round(total * 0.5, 2)} KB" # Mock estimate of doc size
        }
