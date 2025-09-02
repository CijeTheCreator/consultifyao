---
sidebar_position: 6
---

# Pharmacist Process

`Process ID: [TBD]`

## Setup requirements
The pharmacist process requires:
- Orchestrator process ID for sending user notifications
- Setup must be completed before handling prescription operations
- Open permissions allow all users to interact with most handlers

## Making sense of the Pharmacist Process
- **Setup**: Configures the pharmacist process with the Orchestrator process ID for notification delivery
- **AddPrescription**: Records new prescriptions with patient details, drug information, dosage frequency, and duration
- **SendReminder**: Checks all active prescriptions and sends medication reminders based on frequency schedules
- **GetPrescriptions**: Retrieves all prescription history for the requesting user

<!-- Link to the Full Reference (Not yet written at this time) -->
