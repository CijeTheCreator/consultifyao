---
sidebar_position: 4
---

# Triage Process

`Process ID: L7Ze8YMkBf9lO8816ExKKELWJPKOR9DlR00M7dGX90A`

## Setup requirements
The triage process requires:
- APUS Router address for AI inference requests
- Orchestrator process ID for doctor assignment requests
- Setup must be completed before processing triage requests

## Making sense of the Triage Process
- **Setup**: Configures the triage process with APUS router and Orchestrator process IDs
- **ProcessTriageResponse**: Receives patient messages and conversation history to generate AI-powered triage responses
- **AcceptInfer**: Processes AI inference responses and either asks follow-up questions or selects appropriate doctors

<!-- Link to the Full Reference (Not yet written at this time) -->

## Prompt Breakdown
The triage process uses a comprehensive AI prompt that:

**Core Function**: Acts as a medical triage agent to guide short conversations (2-4 questions max) and select the most appropriate doctor specialty.

**Available Specialties**: General Medicine, Cardiology, Dermatology, Endocrinology, Gastroenterology, Neurology, Oncology, Orthopedics, Pediatrics, Psychiatry, Pulmonology, Radiology, Surgery, and Urology.

**Response Format**: Always returns JSON with either:
- `"response-type": "question"` with a follow-up question
- `"response-type": "select-doctor"` with specialty and triage summary

**Key Features**:
- Maintains conversation language consistency
- Limits to 2-4 questions maximum for efficient triage
- Provides concise but informative triage summaries (1-3 sentences)
- Includes symptom details, timeline, and severity assessment
