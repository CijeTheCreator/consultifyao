---
sidebar_position: 3
---

# Triage Process
`Process ID: L7Ze8YMkBf9lO8816ExKKELWJPKOR9DlR00M7dGX90A`

The triage process uses AI to conduct medical assessments and determine appropriate doctor specialties. It asks targeted questions to understand patient symptoms and routes them to the most suitable medical professional.

## Setup
Initializes the triage process with AI router and orchestrator process references.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| APUS_ROUTER | string | Yes | AI inference router process ID |
| ORCHESTRATOR_PROCESS | string | Yes | Orchestrator process ID for doctor assignments |

```lua
ao.send({
  Target = "L7Ze8YMkBf9lO8816ExKKELWJPKOR9DlR00M7dGX90A",
  Action = "Setup",
  Tags = {
    APUS_ROUTER = "ai_router_process_id",
    ORCHESTRATOR_PROCESS = "orchestrator_process_id"
  }
})
```

## ProcessTriageResponse
Processes patient messages and generates AI-powered triage questions or doctor recommendations.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| ConsultationID | string | Yes | ID of consultation requiring triage |
| SenderID | string | Yes | Patient ID sending the message |
| TargetLanguage | string | Yes | Language for triage responses |
| SourceLanguage | string | Yes | Patient's original language |
| PastMessages | string | Yes | JSON array of previous conversation messages |

```lua
ao.send({
  Target = "L7Ze8YMkBf9lO8816ExKKELWJPKOR9DlR00M7dGX90A",
  Action = "ProcessTriageResponse",
  Tags = {
    ConsultationID = "consultation_process_id",
    SenderID = "patient_id",
    TargetLanguage = "en",
    SourceLanguage = "es",
    PastMessages = '[{"patient": "I have chest pain"}]'
  }
})
```

## AcceptInfer
Handles AI inference responses and either sends follow-up questions or assigns doctors based on triage completion.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| X-Reference | string | Yes | Reference ID linking response to original request |

```lua
ao.send({
  Target = "L7Ze8YMkBf9lO8816ExKKELWJPKOR9DlR00M7dGX90A",
  Action = "Infer-Response",
  Data = '{"attestation": "proof", "result": "{\\"response-type\\": \\"question\\", \\"question\\": \\"When did the pain start?\\"}"}',
  Tags = {
    ["X-Reference"] = "tracking_id_1234"
  }
})
```
