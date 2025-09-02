---
sidebar_position: 3
---

# Consultation Process

## Setup requirements
The consultation process requires:
- Orchestrator process ID for notifications and user management
- Triage process ID for handling medical assessments  
- Babel process ID for translation services
- Setup must be completed before handling any consultation operations

## Making sense of the Consultation Process
- **Setup**: Configures the consultation process with required external process IDs
- **CreateConsultation**: Initializes a new consultation session with patient details and language preferences
- **UpdateConsultationState**: Changes consultation state between TRIAGE, DOCTOR, and PRESCRIPTION phases
- **AddMessage**: Records messages from various sources (patients, doctors, triage, babel) with translation metadata
- **UpdateDoctor**: Assigns a doctor to the consultation and transitions to DOCTOR state
- **MessageListener**: Processes incoming messages and routes them appropriately based on consultation state
- **GetMessages**: Retrieves all messages in the consultation thread for authorized participants
- **GetConsultationDetails**: Returns consultation metadata including participant IDs and current state

<!-- Link to the Full Reference (Not yet written at this time) -->

