# Bimba AI Resume Suite Builder Flow

This folder houses the new 13-step Resume Optimization journey.

## Steps Mapping & API Endpoints

| Step | Component | Purpose | Endpoint(s) |
|---|---|---|---|
| 1 | `WelcomeStep` | Welcome / choose setup method | None |
| 2 | `DocumentIngestionStep` | PDF/DOCX/TXT upload or paste fallback | `POST /api/resume-studio/upload`, `POST /api/resume-studio/upload-text` |
| 3 | `ParsingProgressStep` | Real-time loading progress and skeleton loaders | `GET /api/resume-studio/profile/{resume_id}` |
| 4 | `SnapshotEditorStep` | Editorial interface for 16 key resume sections | `PUT /api/resume-studio/update/{resume_id}` |
| 5 | `TemplateSelectionStep` | pick style preferences and template designs | `GET /api/templates` |
| 6 | `CoachInterviewStep` | Interactive LLM chat copilot with live preview | Stubs |
| 7 | `GenerationCompleteStep` | Compiled layout generator screen | None |
| 8 | `AtsScoreStep` | Score metrics and Keyword/Skill validation panels | `PUT /api/resume-studio/update/{resume_id}` |
| 9 | `AiPolishStep` | side-by-side diff suggestion acceptance controls | `PUT /api/resume-studio/update/{resume_id}` |
| 10 | `StructuralAuditStep` | Checklist validating fonts/margins overflows | None |
| 11 | `ExportStep` | Centered live view & export action card buttons | `POST /api/resume-studio/download/{resume_id}` |
| 12 | `JobMatchesStep` | Job recommendation match feed and search filters | `GET /api/jobs/recommendations/{resume_id}` |
| 13 | `ApplicationTrackerStep` | Kanban board with column status toggles | None |
