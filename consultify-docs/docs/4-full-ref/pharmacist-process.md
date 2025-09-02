---
sidebar_position: 5
---

# Pharmacist Process
`Process ID: xf2tY12QQY5Ney0kzfvtxUQZYhP_a80z9RFGdl1k4bM`

The pharmacist process manages prescription tracking and automated medication reminders. It stores prescription data and sends timely notifications to patients based on dosage schedules in multiple languages.

## Setup
Initializes the pharmacist process with the orchestrator process for notifications.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| ORCHESTRATOR_PROCESS | string | Yes | Orchestrator process ID for sending patient notifications |

```lua
ao.send({
  Target = "xf2tY12QQY5Ney0kzfvtxUQZYhP_a80z9RFGdl1k4bM",
  Action = "Setup",
  Tags = {
    ORCHESTRATOR_PROCESS = "orchestrator_process_id"
  }
})
```

## AddPrescription
Adds a new prescription with dosage schedule and patient information.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| PatientID | string | Yes | ID of patient receiving prescription |
| ConsultationID | string | Yes | Consultation where prescription was issued |
| DrugName | string | Yes | Name of prescribed medication |
| Frequency | number | Yes | Daily dosage frequency (1=once, 2=twice, etc.) |
| Start | number | Yes | Start timestamp for prescription |
| End | number | Yes | End timestamp when prescription expires |
| PatientLanguage | string | Yes | Patient's language for reminder notifications |

```lua
ao.send({
  Target = "xf2tY12QQY5Ney0kzfvtxUQZYhP_a80z9RFGdl1k4bM",
  Action = "AddPrescription",
  Tags = {
    PatientID = "patient_id",
    ConsultationID = "consultation_id",
    DrugName = "Aspirin",
    Frequency = "2",
    Start = "1234567890",
    End = "1235432100",
    PatientLanguage = "en"
  }
})
```

## SendReminder
Processes prescription schedules and sends medication reminders to patients when due.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| - | - | - | Uses message timestamp to determine current time |

```lua
ao.send({
  Target = "xf2tY12QQY5Ney0kzfvtxUQZYhP_a80z9RFGdl1k4bM",
  Action = "SendReminder"
})
```

## GetPrescriptions
Retrieves all prescriptions for the requesting patient.

| Tag | Type | Required | Description |
| --------------- | --------------- | --------------- | --------------- |
| - | - | - | No additional tags required |

```lua
ao.send({
  Target = "xf2tY12QQY5Ney0kzfvtxUQZYhP_a80z9RFGdl1k4bM",
  Action = "GetPrescriptions"
})
```
