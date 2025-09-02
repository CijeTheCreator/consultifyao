---
sidebar_position: 1
---

# Messages

## Anatomy of a Message

A message represents a single communication within a consultation between a patient and doctor. Each message is stored with full translation and metadata support for multilingual conversations.

### Message Structure

```lua
{
  message_id = "1725291600ur8IRjSbYqAmBK1cvCTYeV_YJ4SkOMTGOc58SIcpZ9w",
  sender = "patient_process_id_or_doctor_process_id", 
  timestamp = 1725291600,
  originalLanguage = "en",
  originalContent = "I have been feeling nauseous for 2 days",
  translatedLanguage = "es", 
  translatedContent = "He estado sintiendo náuseas por 2 días",
  attestation = "attestation_hash_from_ai_agent"
}
```

### Field Descriptions

- **message_id**: Unique identifier combining timestamp and sender ID
- **sender**: Process ID of the message sender (patient, doctor, or triage agent)
- **timestamp**: Unix timestamp when the message was created
- **originalLanguage**: Language code of the original message (e.g., "en", "es", "fr")
- **originalContent**: The message text in the sender's language
- **translatedLanguage**: Language code of the translated message
- **translatedContent**: The message text translated to the recipient's language
- **attestation**: Cryptographic proof from the AI translation service

### Message Flow

Messages flow through the consultation system with automatic translation:

1. **Patient/Doctor sends message** → Original content stored
2. **Babel process translates** → Translation and attestation added
3. **Message stored in consultation** → Both versions preserved
4. **Recipient receives** → Message in their preferred language

