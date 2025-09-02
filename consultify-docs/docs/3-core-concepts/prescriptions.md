---
sidebar_position: 3
---

# Prescriptions

## Anatomy of a Prescription

A prescription represents a medication regimen prescribed by a doctor to a patient, including automated reminder scheduling and multilingual notification support.

### Prescription Structure

```lua
{
  patient_id = "patient_process_id",
  consultation_id = "consultation_process_id", 
  drug_name = "Amoxicillin",
  frequency = 3, -- doses per day
  startTimestamp = 1725291600,
  endTimestamp = 1725891600, -- 7 days later
  patient_language = "es",
  nextReminderTimestamp = 1725299600 -- calculated dynamically
}
```

### Field Descriptions

- **patient_id**: Process ID of the patient receiving the prescription
- **consultation_id**: Process ID of the consultation where prescription was created
- **drug_name**: Name of the prescribed medication
- **frequency**: Number of doses per day (1=daily, 2=twice daily, 3=three times daily, etc.)
- **startTimestamp**: Unix timestamp when medication regimen begins
- **endTimestamp**: Unix timestamp when medication regimen ends  
- **patient_language**: Language code for medication reminders
- **nextReminderTimestamp**: Calculated timestamp for next reminder (internal field)

### Reminder System

The pharmacist process automatically calculates and sends medication reminders:

#### Frequency Calculation
- **Frequency 1**: Every 24 hours
- **Frequency 2**: Every 12 hours  
- **Frequency 3**: Every 8 hours
- **Frequency 4**: Every 6 hours

#### Reminder Messages

Reminders are sent in the patient's preferred language:

```lua
-- English
"Time to take your medication: Amoxicillin"

-- Spanish  
"Hora de tomar tu medicamento: Amoxicillin"

-- French
"Il est temps de prendre votre médicament : Amoxicillin"
```

#### Supported Languages
- English (en)
- Spanish (es) 
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Chinese (zh)
- Japanese (ja)

### Prescription Lifecycle

1. **Doctor prescribes medication** during consultation
2. **Prescription created** with start/end times and frequency
3. **Reminder scheduling** begins automatically
4. **Patient receives notifications** in their language
5. **Prescription expires** when end timestamp is reached
