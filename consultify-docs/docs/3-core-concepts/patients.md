---
sidebar_position: 5
---

# Patient

## Anatomy of a Patient

A patient represents an individual registered on the platform who can create consultations and receive medical care through the multilingual telemedicine system.

### Patient Structure

```lua
Patients[patient_id] = {
  patient_id = "patient_process_id",
  consultation_history = {
    "consultation_process_id_1",
    "consultation_process_id_2"
  },
  language_preference = "es",
  registration_date = 1725291600
}
```

### Field Descriptions

- **patient_id**: Unique process ID identifying the patient
- **consultation_history**: Array of consultation process IDs for this patient
- **language_preference**: Patient's preferred language for all communications
- **registration_date**: Unix timestamp when patient registered on platform

### Language Support

Patients can communicate in their preferred language with automatic translation:

#### Supported Languages
- **English (en)**: Default platform language
- **Spanish (es)**: Español  
- **French (fr)**: Français
- **German (de)**: Deutsch
- **Italian (it)**: Italiano
- **Portuguese (pt)**: Português
- **Chinese (zh)**: 中文
- **Japanese (ja)**: 日本語

### Payment System

Patients use USDA tokens for consultations:

#### Consultation Fees
- **Fee per consultation**: 5 USDA tokens
- **Payment method**: Pre-deposit tokens to platform
- **Token faucet**: 50 USDA tokens available for demo purposes

#### Payment Flow
1. **Deposit USDA**: Patient transfers tokens to orchestrator process
2. **Create consultation**: 5 USDA automatically deducted
3. **Consultation created**: New process spawned for medical interaction

### Patient Features

#### Consultation History
- **Complete record**: All past consultations linked to patient
- **Message access**: Full conversation history with translations
- **Prescription tracking**: Medication history across consultations

#### Notifications
- **System messages**: Updates on consultation status
- **Medication reminders**: Prescription timing notifications  
- **Doctor assignments**: Notification when doctor is assigned
- **Language preference**: All notifications in patient's language

### Patient Lifecycle

1. **Registration**: Patient creates account with language preference
2. **Token deposit**: Patient funds account with USDA tokens
3. **Consultation creation**: Patient initiates medical consultation
4. **Triage process**: Automated symptom assessment
5. **Doctor assignment**: Matching doctor assigned based on specialty
6. **Medical consultation**: Direct communication with doctor
7. **Prescription management**: Medication reminders and tracking
