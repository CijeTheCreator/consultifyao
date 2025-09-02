---
sidebar_position: 1
---

# Orchestrator Process
`Process ID: gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0`

The orchestrator process manages user registration, consultation coordination, doctor assignments, and payment processing. It serves as the central hub that coordinates interactions between patients, doctors, and other specialized processes.

## Setup
Initializes the orchestrator process with required parameters.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| USD_TOKEN | string | Yes | Token contract address for payments |

```lua
ao.send({
  Target = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0",
  Action = "Setup",
  Tags = {
    USD_TOKEN = "token_process_address_here"
  }
})
```

## RegisterPatient
Registers a new patient in the system.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| PreferredLanguage | string | Yes | Patient's preferred language code (en, es, fr, etc.) |

```lua
ao.send({
  Target = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0",
  Action = "RegisterPatient",
  Tags = {
    PreferredLanguage = "en"
  }
})
```

## RegisterDoctor
Registers a new doctor with specialty and stake information.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| SpecialtyType | string | Yes | Medical specialty (General Medicine, Cardiology, etc.) |
| PreferredLanguage | string | Yes | Doctor's preferred language code |
| Stake | number | Yes | Minimum stake amount required |

```lua
ao.send({
  Target = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0",
  Action = "RegisterDoctor",
  Tags = {
    SpecialtyType = "General Medicine",
    PreferredLanguage = "en",
    Stake = "10"
  }
})
```

## RequestConsultation
Initiates a new consultation session for a patient.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| - | - | - | No additional tags required |

```lua
ao.send({
  Target = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0",
  Action = "RequestConsultation"
})
```

## RequestDoctorAssignment
Assigns a doctor to an active consultation based on specialty requirements.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| ConsultationId | string | Yes | ID of the consultation requiring doctor assignment |
| DoctorSpecialty | string | Yes | Required medical specialty for the consultation |
| TriageSummary | string | Yes | Summary of patient's condition from triage |

```lua
ao.send({
  Target = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0",
  Action = "RequestDoctorAssignment",
  Tags = {
    ConsultationId = "consultation_process_id",
    DoctorSpecialty = "Cardiology",
    TriageSummary = "Patient experiencing chest pain"
  }
})
```

## AddNotification
Adds a notification message for a specific user.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| Recipient | string | Yes | User ID who will receive the notification |
| Timestamp | number | Yes | Unix timestamp when notification was created |
| JSONMetadata | string | No | Additional metadata in JSON format |

```lua
ao.send({
  Target = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0",
  Action = "AddNotification",
  Data = "Your consultation has been scheduled",
  Tags = {
    Recipient = "patient_id",
    Timestamp = "1234567890",
    JSONMetadata = "{}"
  }
})
```

## GetNotifications
Retrieves all notifications for the requesting user.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| - | - | - | No additional tags required |

```lua
ao.send({
  Target = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0",
  Action = "GetNotifications"
})
```

## GetConsultations
Retrieves consultation history for the requesting user.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| - | - | - | No additional tags required |

```lua
ao.send({
  Target = "gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0",
  Action = "GetConsultations"
})
```
