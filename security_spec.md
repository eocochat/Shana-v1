# SHANA SECURITY SPECIFICATION
# Phase 0: Payload-First Security TDD

This specification defines the security invariants and boundary checks for the SHANA Firestore database. It includes the "Dirty Dozen" malicious payloads designed to test our attribute-based access control (ABAC) and a TypeScript test suite template.

## 1. Data Invariants & Access Control Policy

| Collection | Path | Primary Key / Doc ID | Access Control Policy | Critical Field Constraints |
|---|---|---|---|---|
| **Users** | `/users/{userId}` | Authenticated `uid` | Owner-Only (Read/Write) | `email` (string, max 100 char), `name` (string, max 100 char), `created_at` (request.time) |
| **Profiles** | `/profiles/{userId}` | Authenticated `uid` | Owner-Only (Read/Write) | `user_id` must match `request.auth.uid`, size limits on target role & level |
| **Sessions** | `/interview_sessions/{sessionId}` | Random ID | Owner-Only (Read/Write) | `user_id` must match `request.auth.uid` |
| **Answers** | `/answers/{answerId}` | Random ID | Owner-Only (Read/Write) | Parent session `user_id` must match `request.auth.uid` |
| **Scores** | `/scores/{sessionId}` | Session ID | Owner-Only (Read/Write) | Parent session `user_id` must match `request.auth.uid` |
| **Insights** | `/insights/{insightId}` | Random ID | Owner-Only (Read/Write) | `user_id` must match `request.auth.uid` |
| **Events** | `/events/{eventId}` | Random ID | Owner-Only (Read/Write) | `user_id` must match `request.auth.uid` |
| **Monetization** | `/monetization/{userId}` | Authenticated `uid` | Owner-Only (Read), Server-Only (Write) | Credits, subscription tier, and balances cannot be client-updated |

---

## 2. The "Dirty Dozen" Attack Payloads

The following payloads represent attempt types designed to bypass identity, integrity, and state transition safeguards. Our firestore rules must mathematically prevent these operations.

### Payload 1: Identity Spoofing - Creating User Profile for Another UID
*   **Target Path**: `/users/attacker_uid` (Authenticated as `victim_uid`)
*   **Intent**: Attempt to create or overwrite another user's identity record.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 2: Privilege Escalation - Setting Admin Flag
*   **Target Path**: `/users/victim_uid`
*   **Payload**: `{ "role": "admin", "isAdmin": true }`
*   **Intent**: Injecting non-existent administrative flags into the profile.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 3: Identity Spoofing - Creating Session for Another User
*   **Target Path**: `/interview_sessions/session_123`
*   **Payload**: `{ "id": "session_123", "user_id": "victim_uid", "mode": "beginner", "status": "active" }`
*   **Intent**: Create a session on behalf of another user.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 4: Orphaned Writes - Creating Answers with Non-Owned Session
*   **Target Path**: `/answers/ans_123`
*   **Payload**: `{ "id": "ans_123", "session_id": "victim_session_999", "question": "Explain React hooks.", "answer": "I don't know." }`
*   **Intent**: Link answers to a session owned by another candidate.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 5: Financial Hijack - Client-Side Credit Injection
*   **Target Path**: `/monetization/victim_uid`
*   **Payload**: `{ "freeAudio": 999999, "packAudio": 999999, "ultraActive": true }`
*   **Intent**: Maliciously inflate credits or activate premium subscription without paying.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 6: Resource Poisoning - Giant ID Character Flood (Buffer Overflow)
*   **Target Path**: `/users/super_long_junk_id_greater_than_128_characters_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
*   **Intent**: Injecting massive/junk strings as document IDs.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 7: Denial of Wallet - Unbounded Array/String Blobs
*   **Target Path**: `/profiles/victim_uid`
*   **Payload**: `{ "target_role": "A".repeat(1000000) }` (1 MB role name)
*   **Intent**: Trigger massive Firestore resource consumption and cloud storage bill hikes.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 8: Temporal Deception - Client-Forged Timestamp
*   **Target Path**: `/interview_sessions/session_123`
*   **Payload**: `{ "created_at": "2030-01-01T00:00:00Z" }`
*   **Intent**: Override creation timestamps with future dates to bypass session expiration locks.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 9: Terminal State Bypass - Modifying Completed Sessions
*   **Target Path**: `/interview_sessions/session_completed` (Existing state: `status: "completed"`)
*   **Payload**: `{ "status": "active", "ips_score": 100 }`
*   **Intent**: Force a finalized session back into active mode to change evaluation results.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 10: State Shortcutting - Partial Update of Immutable Fields
*   **Target Path**: `/profiles/victim_uid` (Existing state: `user_id: "victim_uid"`)
*   **Payload**: `{ "user_id": "attacker_uid" }`
*   **Intent**: Re-associate an existing profile with a different user identity.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 11: PII Leak - Unauthenticated Document Retrieval (Scraping)
*   **Target Path**: `/users/any_uid`
*   **Intent**: Fetch another user's email/name without being authenticated or as a different user.
*   **Expected Result**: `PERMISSION_DENIED`

### Payload 12: Email Spoofing Attack
*   **Target Path**: `/users/admin_uid`
*   **Intent**: Access admin paths with `email_verified` as `false` or forged token.
*   **Expected Result**: `PERMISSION_DENIED`

---

## 3. Test Runner (firestore.rules.test.ts)

Below is the complete testing script template designed for verifying these rules.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

describe("SHANA Firestore Security Rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "ai-studio-shana-test",
      firestore: {
        rules: `
          // rules go here
        `
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test("Payload 1: Identity Spoofing - Users path owner constraint", async () => {
    const context = testEnv.authenticatedContext("victim_uid");
    const db = context.firestore();
    const ref = doc(db, "users", "attacker_uid");
    await expect(setDoc(ref, { email: "test@test.com", name: "Attacker" }))
      .rejects.toThrow();
  });
});
```
