---
sidebar_position: 3
---

# Self Loading

Set up your own instance of ConsultifyAO to run the complete telemedicine platform locally or deploy it to your own infrastructure. This guide covers both the AO processes and the Next.js frontend application.

## System Requirements

Before setting up ConsultifyAO, ensure your system meets these requirements and has the necessary tools installed.

- **Node.js** (v18 or higher) - [Download from nodejs.org](https://nodejs.org/)
- **aos** - [Installation guide](https://cookbook_ao.g8way.io/)
- **pnpm** (Package manager) - [Install pnpm](https://pnpm.io/installation)
- **Git** - [Download Git](https://git-scm.com/downloads)
- **10-15 minutes** for complete setup
- **Arweave Wallet** with AR tokens for deploying processes

## Setup Guide

### Setting up AOS Processes

**Step 1: Clone the Repository**
Download the ConsultifyAO codebase to your local machine.

```bash
git clone https://github.com/CijeTheCreator/consultify-ao.git
cd consultify-ao
```

**Step 2: Launch AOS Console**
Start the AOS environment to begin deploying blockchain processes.

```bash
aos
```

**Step 3: Spawn Each Process**
Create new process instances for each component of the ConsultifyAO system.

```lua

**Step 4: Load Process Code**
Load the Lua code into each spawned process.

```lua
-- Switch to orchestrator process and load its code
.load processes/orchestrator.lua

-- Switch to triage process and load its code
.load processes/triage.lua

-- Switch to babel process and load its code
.load processes/babel.lua

-- Switch to pharmacist process and load its code
.load processes/pharmacist.lua
```

**Step 5: Initialize All Processes**
Interact with the Setup handler on each process to initialize their configurations.

**Step 6: Fund the Faucet (Optional)**
If you plan to use the token faucet for testing, send USDA tokens to the registration process.

```lua
-- Send USDA tokens to the registration process for faucet functionality
Send({Target = "<Astro USDA process>", Action = "Transfer", Quantity = "1000", Recipient = "<Orchestrator Process ID>"})
```

### Setting up the Frontend UI

**Step 1: Navigate to Frontend Directory**
Move into the frontend application folder.

```bash
cd frontend
```

**Step 2: Configure Environment Variables**
Create and configure your environment file with the necessary process IDs and settings.

```bash
cp .env.example .env
```

Edit the `.env` file with your process configurations:

```env
# Development environment setting
NEXT_PUBLIC_ENVIRONMENT=DEVELOPMENT

# Message polling rate in milliseconds (how often to check for new messages)
NEXT_PUBLIC_MESSAGE_POLLING_RATE=1000

# Your registration process ID (main orchestrator)
NEXT_PUBLIC_ORCHESTRATOR_PROCESS=your-registration-process-id

# USDA token contract process ID
NEXT_PUBLIC_USDA_PROCESS=your-usda-process-id

# Pharmacist process ID for prescription management
NEXT_PUBLIC_PHARMACIST_PROCESS=your-pharmacist-process-id

# Triage process ID for AI-powered medical assessment
NEXT_PUBLIC_TRIAGE_PROCESS=your-triage-process-id
```

**Environment Variable Explanations:**
- `NEXT_PUBLIC_ENVIRONMENT`: Set to "DEVELOPMENT" for local testing or "PRODUCTION" for live deployment
- `NEXT_PUBLIC_MESSAGE_POLLING_RATE`: Controls how frequently the UI checks for new messages (1000ms = 1 second)
- `NEXT_PUBLIC_ORCHESTRATOR_PROCESS`: The main registration process that handles user management and consultation creation
- `NEXT_PUBLIC_USDA_PROCESS`: The USDA token contract for handling payments
- `NEXT_PUBLIC_PHARMACIST_PROCESS`: Manages prescriptions and medication reminders
- `NEXT_PUBLIC_TRIAGE_PROCESS`: AI triage system for initial patient assessment

**Step 3: Install Dependencies**
Install all required Node.js packages using pnpm.

```bash
pnpm install
```

**Step 4: Start the Development Server**
Launch the Next.js development server to run the application locally.

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

**Step 5: Verify Setup**
Open your browser and navigate to the local application to ensure everything is working correctly.

:::tip Congratulations!
Your ConsultifyAO instance is now running! You have successfully deployed all blockchain processes and launched the frontend application. You can now register users, create consultations, and experience the full decentralized telemedicine platform.
:::
