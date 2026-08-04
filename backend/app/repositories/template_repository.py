from typing import List, Optional, Dict, Any
from bson import ObjectId
from datetime import datetime
from app.core.mongodb import db, stringify_object_ids
from app.models.template import ResumeTemplate

class TemplateRepository:
    def __init__(self):
        self.collection = db.resume_templates

    def _to_model(self, doc: Optional[Dict[str, Any]]) -> Optional[ResumeTemplate]:
        if not doc:
            return None
        return ResumeTemplate(doc)

    def get_by_id(self, id_str: str) -> Optional[ResumeTemplate]:
        try:
            doc = self.collection.find_one({"_id": ObjectId(id_str)})
            if not doc:
                doc = self.collection.find_one({"templateId": id_str})
            return self._to_model(doc)
        except Exception:
            # Fallback to checking templateId if ObjectId format fails
            doc = self.collection.find_one({"templateId": id_str})
            return self._to_model(doc)

    def get_by_template_id(self, template_id: str) -> Optional[ResumeTemplate]:
        doc = self.collection.find_one({"templateId": template_id})
        return self._to_model(doc)

    def list_templates(
        self,
        filters: Dict[str, Any] = None,
        search_query: str = None,
        skip: int = 0,
        limit: int = 100,
        sort_field: str = "displayOrder"
    ) -> List[ResumeTemplate]:
        query = {}
        if filters:
            for k, v in filters.items():
                if v is not None:
                    query[k] = v

        if search_query:
            query["$or"] = [
                {"name": {"$regex": search_query, "$options": "i"}},
                {"category": {"$regex": search_query, "$options": "i"}},
                {"description": {"$regex": search_query, "$options": "i"}},
                {"recommendedFor": {"$regex": search_query, "$options": "i"}},
                {"industry": {"$regex": search_query, "$options": "i"}}
            ]

        cursor = self.collection.find(query).skip(skip).limit(limit).sort(sort_field, 1)
        return [ResumeTemplate(doc) for doc in cursor]

    def create(self, data: Dict[str, Any]) -> ResumeTemplate:
        now = datetime.utcnow()
        data["createdAt"] = now
        data["updatedAt"] = now
        # Auto-detect displayOrder if not set
        if "displayOrder" not in data or not data["displayOrder"]:
            max_order_doc = self.collection.find_one(sort=[("displayOrder", -1)])
            data["displayOrder"] = (max_order_doc.get("displayOrder", 0) + 1) if max_order_doc else 1
            
        result = self.collection.insert_one(data)
        doc = self.collection.find_one({"_id": result.inserted_id})
        return ResumeTemplate(doc)

    def update(self, id_str: str, data: Dict[str, Any]) -> Optional[ResumeTemplate]:
        data["updatedAt"] = datetime.utcnow()
        # Prevent updating ID fields
        data.pop("_id", None)
        data.pop("id", None)
        
        query = {}
        try:
            query = {"_id": ObjectId(id_str)}
            # Verify if doc exists with ObjectId
            if not self.collection.find_one(query):
                query = {"templateId": id_str}
        except Exception:
            query = {"templateId": id_str}

        self.collection.update_one(query, {"$set": data})
        doc = self.collection.find_one(query)
        return self._to_model(doc)

    def delete(self, id_str: str) -> bool:
        query = {}
        try:
            query = {"_id": ObjectId(id_str)}
            if not self.collection.find_one(query):
                query = {"templateId": id_str}
        except Exception:
            query = {"templateId": id_str}
            
        result = self.collection.delete_one(query)
        return result.deleted_count > 0

    def reorder(self, template_ids: List[str]) -> bool:
        for index, template_id in enumerate(template_ids):
            self.collection.update_one(
                {"templateId": template_id},
                {"$set": {"displayOrder": index + 1, "updatedAt": datetime.utcnow()}}
            )
        return True

    def enable_disable_bulk(self, template_ids: List[str], enabled: bool) -> bool:
        self.collection.update_many(
            {"templateId": {"$in": template_ids}},
            {"$set": {"enabled": enabled, "updatedAt": datetime.utcnow()}}
        )
        return True

    def get_categories(self) -> List[str]:
        return self.collection.distinct("category")
