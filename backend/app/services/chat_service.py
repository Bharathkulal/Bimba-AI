import json
from typing import Dict, Any, List
from app.services.ai_provider_manager import AIProviderManager
from app.core.mongodb import get_next_sequence
from datetime import datetime, timezone

class ChatService:
    def __init__(self, db: Any):
        self.db = db
        self.ai_manager = AIProviderManager(db)

    def handle_chat_message(self, student_id: int, resume_id: int, message: str, explicit_mode: str = None) -> Dict[str, Any]:
        # 1. Fetch Resume Context
        resume = self.db.resumes.find_one({"id": resume_id, "student_id": student_id})
        if not resume:
            raise ValueError("Resume not found or access denied")

        # 2. Fetch Student saved jobs
        saved_jobs_cursor = self.db.saved_jobs.find({"user_id": student_id})
        saved_jobs = list(saved_jobs_cursor)
        jobs_context = "\n".join([f"- {j.get('title')} at {j.get('company')}" for j in saved_jobs])

        # 3. Classify/Infer Inferred Mode
        inferred_mode = explicit_mode
        msg_lower = message.lower()
        
        if not inferred_mode:
            if "http" in msg_lower or len(message) > 400 or "responsibilities" in msg_lower or "requirements" in msg_lower:
                inferred_mode = "JD Tailoring"
            elif "/interview" in msg_lower or "prep" in msg_lower or "mock" in msg_lower or "interview" in msg_lower:
                inferred_mode = "Interview Prep"
            elif "/gaps" in msg_lower or "gap" in msg_lower or "layoff" in msg_lower or "pivot" in msg_lower or "unemployed" in msg_lower:
                inferred_mode = "Gap Conversation"
            elif "/sync" in msg_lower or "linkedin" in msg_lower or "portfolio" in msg_lower or "about" in msg_lower:
                inferred_mode = "Profile Sync"
            elif "/tracker" in msg_lower or "applied" in msg_lower or "responses" in msg_lower or "tracker" in msg_lower:
                inferred_mode = "Application Tracker"
            elif "/analyst" in msg_lower or "why did you flag" in msg_lower or "flag" in msg_lower or "rewrite" in msg_lower:
                inferred_mode = "Analyst"
            else:
                inferred_mode = "Career Copilot"

        # 4. Load Conversation History (last 8 turns)
        history_cursor = self.db.chat_messages.find({"resume_id": resume_id, "student_id": student_id}).sort("timestamp", 1).limit(8)
        history = list(history_cursor)
        history_context = ""
        for h in history:
            role = "User" if h.get("sender") == "user" else "Assistant"
            history_context += f"{role}: {h.get('text')}\n"

        # 5. Build System Prompt with full context
        resume_data = {
            "name": resume.get("name"),
            "target_role": resume.get("target_role"),
            "career_objective": resume.get("career_objective"),
            "summary": resume.get("summary"),
            "skills": [s.get("name") for s in resume.get("skills", [])],
            "experience": [{"company": e.get("company"), "position": e.get("position"), "description": e.get("description")} for e in resume.get("experience", [])],
            "projects": [{"name": p.get("name"), "description": p.get("description")} for p in resume.get("projects", [])]
        }

        system_instruction = f"""
You are the Bimba AI Career Copilot Chatbot. You carry forward full context of the user's resume, goals, and applications.
Current Resume Context: {json.dumps(resume_data)}
User's Tracked Applications/Saved Jobs:
{jobs_context or "No saved jobs yet."}

Conversation History:
{history_context}

You are currently operating in mode: {inferred_mode}
Mode Rules:
- Career Copilot (Default): Act as a strategic career advisor. If you suggest a bullet rewrite, format it exactly like:
  REWRITE: "[original text]" -> "[suggested text]" | Reason: [short reason why]
- Analyst: Focus on flagged issues, metrics, grammar, and ATS scoring.
- JD Tailoring: Compare the user's resume to the pasted job description. Return a match percentage (e.g. 75%), list top 3 missing keywords, and offer a suggested tailored rewrite.
- Interview Prep: Conduct a turn-by-turn mock interview. Ask ONE high-probability question based on their resume/target role, wait for their answer, provide feedback, and show a stronger STAR-format phrasing.
- Gap Conversation: Provide judgment-free support for career gaps or pivots. Offer phrasing options they can approve.
- Profile Sync: Generate LinkedIn 'About' or portfolio bio copy.
- Application Tracker: Offer follow-up email drafts and check application metrics.

Always explain the "Why" inline with your changes in a conversational, premium, and friendly tone.
For action items (like bullet rewrites), ensure the exact structure 'REWRITE: "original" -> "suggested" | Reason: reason' is present in your response.
"""
        
        # 6. Call LLM Gateway
        prompt = f"{system_instruction}\nUser: {message}\nAssistant:"
        ai_reply = self.ai_manager.call_llm(prompt, feature=f"Chatbot: {inferred_mode}")

        # 7. Scan for inline rewrite actions
        actions = []
        # Pattern match: REWRITE: "original" -> "suggested" | Reason: reason
        matches = re_find_rewrites(ai_reply)
        for m in matches:
            actions.append({
                "type": "apply_rewrite",
                "original": m[0],
                "suggested": m[1],
                "reason": m[2]
            })

        # Scan for cover letter card
        if inferred_mode == "JD Tailoring" and ("cover letter" in ai_reply.lower() or "dear hiring manager" in ai_reply.lower()):
            actions.append({
                "type": "generate_cover_letter",
                "draft": ai_reply
            })

        # Save to DB
        timestamp = datetime.now(timezone.utc)
        self.db.chat_messages.insert_many([
            {
                "id": get_next_sequence("chat_messages"),
                "resume_id": resume_id,
                "student_id": student_id,
                "sender": "user",
                "text": message,
                "timestamp": timestamp
            },
            {
                "id": get_next_sequence("chat_messages"),
                "resume_id": resume_id,
                "student_id": student_id,
                "sender": "ai",
                "text": ai_reply,
                "timestamp": timestamp,
                "mode": inferred_mode,
                "actions": actions
            }
        ])

        return {
            "response": ai_reply,
            "inferred_mode": inferred_mode,
            "actions": actions
        }

def re_find_rewrites(text: str) -> List[tuple]:
    import re
    # Match REWRITE: "original" -> "suggested" | Reason: reason
    pattern = r'(?i)REWRITE:\s*["\']([^"\']+)["\']\s*->\s*["\']([^"\']+)["\']\s*\|\s*Reason:\s*([^:\n]+)'
    return re.findall(pattern, text)
