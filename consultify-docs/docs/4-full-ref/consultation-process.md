---
sidebar_position: 2
---

# Consultation Process

The consultation process manages individual medical consultations between patients and doctors. It handles message routing, state transitions, and coordination with translation and triage services.

## Setup
Initializes the consultation process with required external process references.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| ORCHESTRATOR_PROCESS | string | Yes | Orchestrator process ID for notifications |
| TRIAGE_PROCESS | string | Yes | Triage process ID for medical assessment |
| BABEL_PROCESS | string | Yes | Translation process ID for language support |

```lua
ao.send({
  Target = "{CONSULTATION_PROCESS_ID}",
  Action = "Setup",
  Tags = {
    ORCHESTRATOR_PROCESS = "orchestrator_process_id",
    TRIAGE_PROCESS = "triage_process_id",
    BABEL_PROCESS = "babel_process_id"
  }
})
```

## CreateConsultation
Creates a new consultation session with patient information.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| PatientID | string | Yes | Unique identifier of the patient |
| PatientLanguage | string | Yes | Patient's preferred language code |

```lua
ao.send({
  Target = "{CONSULTATION_PROCESS_ID}",
  Action = "CreateConsultation",
  Tags = {
    PatientID = "patient_process_id",
    PatientLanguage = "en"
  }
})
```

## UpdateConsultationState
Changes the consultation state between TRIAGE, DOCTOR, and PRESCRIPTION phases.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| NewState | string | Yes | Target state: TRIAGE, DOCTOR, or PRESCRIPTION |

```lua
ao.send({
  Target = "{CONSULTATION_PROCESS_ID}",
  Action = "UpdateConsultationState",
  Tags = {
    NewState = "DOCTOR"
  }
})
```

## AddMessage
Adds a message to the consultation thread with translation metadata.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| Sender | string | Yes | ID of message sender |
| Timestamp | number | Yes | Unix timestamp of message |
| OriginalLanguage | string | Yes | Source language code |
| OriginalContent | string | Yes | Original message content |
| TranslatedLanguage | string | No | Target language for translation |
| TranslatedContent | string | No | Translated message content |

```lua
ao.send({
  Target = "{CONSULTATION_PROCESS_ID}",
  Action = "AddMessage",
  Tags = {
    Sender = "patient_id",
    Timestamp = "1234567890",
    OriginalLanguage = "en",
    OriginalContent = "I have been feeling dizzy",
    TranslatedLanguage = "es",
    TranslatedContent = "Me he sentido mareado"
  }
})
```

## UpdateDoctor
Assigns a doctor to the consultation and transitions to DOCTOR state.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| DoctorID | string | Yes | Unique identifier of assigned doctor |

```lua
ao.send({
  Target = "{CONSULTATION_PROCESS_ID}",
  Action = "UpdateDoctor",
  Tags = {
    DoctorID = "doctor_process_id"
  }
})
```

## MessageListener
Processes incoming messages from participants and routes them appropriately based on consultation state.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| MessageID | string | Yes | Unique identifier for the message |

```lua
ao.send({
  Target = "{CONSULTATION_PROCESS_ID}",
  Action = "Message-Response",
  Data = "Patient message content",
  Tags = {
    MessageID = "unique_message_id"
  }
})
```

## GetMessages
Retrieves all messages in the consultation thread for authorized participants.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| - | - | - | No additional tags required |

```lua
ao.send({
  Target = "{CONSULTATION_PROCESS_ID}",
  Action = "GetMessages"
})
```

## GetConsultationDetails
Returns consultation metadata including state, participants, and timestamps.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| - | - | - | No additional tags required |

```lua
ao.send({
  Target = "{CONSULTATION_PROCESS_ID}",
  Action = "GetConsultationDetails"
})
```
