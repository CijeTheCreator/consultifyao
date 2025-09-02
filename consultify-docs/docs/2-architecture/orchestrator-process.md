---
sidebar_position: 2
---

# Orchestrator Process

`Process ID: gdZ9_zb8fqeKalOpbF99tXfEquy7BNc_oral6zV6fl0`

## Setup requirements
The orchestrator process requires:
- USDA token instantiation via `InstantiateUSDA` handler
- Owner permissions for critical operations
- Initial setup is enabled by default (`HAS_SETUP = true`)

## Making sense of the Orchestrator Process
- **RegisterPatient**: Allows users to register as patients with language preferences
- **UnregisterPatient**: Removes patient registration and associated data
- **RegisterDoctor**: Enables healthcare providers to register with specialty types and language preferences
- **UnregisterDoctor**: Handles doctor deregistration and stake returns
- **Create**: Spawns new consultation processes when patients request consultations
- **StakeUSDA**: Allows doctors to stake USDA tokens to participate in the weighted doctor selection
- **AcceptUSDA**: Processes incoming USDA token transfers and updates user balances
- **RequestDoctorAssignment**: Assigns doctors to consultations based on specialty and weighted random selection
- **WithdrawUSDA**: Enables users to withdraw their USDA token balances
- **AddNotification**: Manages user notifications across the platform
- **GetUSDABalance**: Retrieves user's USDA token balance
- **GetDoctorDetails**: Fetches doctor profile information
- **GetPatientDetails**: Retrieves patient profile data
- **GetUserNotifications**: Returns user's notification history
- **GetPatientConsultations**: Lists all consultations for a patient
- **GetDoctorConsultations**: Shows all consultations assigned to a doctor
- **RequestTokens**: Provides test tokens via faucet functionality

<!-- Link to the Full Reference (Not yet written at this time) -->
