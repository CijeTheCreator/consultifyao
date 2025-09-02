---
sidebar_position: 5
---

# Babel Process
`Process ID: [TBD]`

## Setup requirements
The babel process requires:
- APUS Router address for AI translation inference requests
- Owner permissions for setup operations
- Setup must be completed before processing translation requests

## Making sense of the Babel Process
- **Setup**: Configures the babel process with the APUS router address for AI inference
- **ProcessBabelResponse**: Receives translation requests with source content and target language, then forwards to AI for processing
- **AcceptInfer**: Processes AI translation responses and forwards the translated content back to the consultation

<!-- Link to the Full Reference (Not yet written at this time) -->

## Prompt Breakdown
The babel process uses a specialized translation prompt that:

**Core Function**: Acts as a translator that converts text from one language to another with high accuracy.

**Supported Languages**: English (en), Español (es), Français (fr), Deutsch (de), Italiano (it), Português (pt), 中文 (zh), and 日本語 (ja).

**Input Format**: JSON structure containing:
- `"target-language"`: Language code for translation target
- `"source-content"`: Text content to be translated

**Output Format**: Strict JSON response with:
- `"target-language"`: Target language code
- `"target-content"`: Translated text content

**Key Features**:
- Enforces JSON-only output with no explanations or extra text
- Uses consistent language codes across the platform
- Maintains medical context and terminology accuracy
- Includes JSON wrapper for proper parsing
