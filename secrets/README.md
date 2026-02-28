# Credential Vault

This directory contains sensitive API keys and secrets.

**IMPORTANT**: These files are gitignored and should NEVER be committed.

## Structure

- `.env` - Active secrets (gitignored)
- `.env.example` - Template showing expected variables

## Security

- The `.env` file is read at startup and cached in-memory
- Secrets are never logged or persisted to session history
- API keys are redacted from all system outputs

## Usage

Set credentials in `.env` file, then access them via the `secrets` tool:

```typescript
const apiKey = secrets.get('OPENAI_API_KEY');
```
