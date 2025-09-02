---
sidebar_position: 4
---

# Babel Process
`Process ID: mgFiTRfiX32cNdGUKC4FQ_OO6p4dCcdedC9eAI8zk1o`

The babel process provides AI-powered translation services for medical consultations. It supports 8 languages and ensures accurate medical communication between patients and doctors who speak different languages.

## Setup
Initializes the babel process with the AI inference router.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| APUS_ROUTER | string | Yes | AI inference router process ID for translations |

```lua
ao.send({
  Target = "mgFiTRfiX32cNdGUKC4FQ_OO6p4dCcdedC9eAI8zk1o",
  Action = "Setup",
  Tags = {
    APUS_ROUTER = "ai_router_process_id"
  }
})
```

## ProcessBabelResponse
Initiates translation request for medical consultation messages.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| ConsultationID | string | Yes | ID of consultation requiring translation |
| SenderID | string | Yes | ID of message sender |
| TargetLanguage | string | Yes | Target language code for translation |
| SourceLanguage | string | Yes | Source language of original content |
| SourceContent | string | Yes | Text content to be translated |

```lua
ao.send({
  Target = "mgFiTRfiX32cNdGUKC4FQ_OO6p4dCcdedC9eAI8zk1o",
  Action = "ProcessBabelResponse",
  Tags = {
    ConsultationID = "consultation_process_id",
    SenderID = "patient_id",
    TargetLanguage = "es",
    SourceLanguage = "en",
    SourceContent = "I have been experiencing headaches"
  }
})
```

## AcceptInfer
Processes AI translation responses and forwards translated content to the consultation.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| X-Reference | string | Yes | Reference ID linking response to original translation request |

```lua
ao.send({
  Target = "mgFiTRfiX32cNdGUKC4FQ_OO6p4dCcdedC9eAI8zk1o",
  Action = "Infer-Response",
  Data = '{"attestation": "proof", "result": "{\\"target-language\\": \\"es\\", \\"target-content\\": \\"He estado experimentando dolores de cabeza\\"}"}',
  Tags = {
    ["X-Reference"] = "translation_tracking_id"
  }
})
```
