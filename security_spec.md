# Firestore Security Specification — Signature Artistry by Farhana

## 1. Data Invariants
1. **Owner-Isolated PII**: `users/{userId}`, `bookings/{bookingId}`, and `reminders/{reminderId}` contain PII (`email`, `phone`, `location`). Read and list operations are strictly gated to `request.auth.uid == owner` or `isAdmin()`.
2. **Public Slot Separation**: Calendar slot locks live in `bookedSlots/{slotId}` without any email, phone, or client name so unauthenticated visitors can view live slot availability without leaking PII.
3. **Conversation Master Gate**: Messages under `conversations/{conversationId}/messages/{messageId}` require parent existence via `exists(...)` and parent ownership via `get(...)` on `create` and `get`, while storing `clientId` on the message document for cost-safe `allow list` enforcement.
4. **Immutable Ownership & Timestamps**: `userId`/`clientId` and `createdAt` cannot be modified after creation; `createdAt` and `updatedAt` must equal `request.time`.
5. **Terminal State Locking**: Once a booking reaches `completed` or `cancelled`, non-admin clients cannot mutate it.
6. **Verified Identity**: All writes require `request.auth.token.email_verified == true`.

## 2. Dirty Dozen Adversarial Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated write to `/bookings/b1`.
2. Creating `/bookings/b2` with `userId` spoofed to another user's UID.
3. Creating `/bookings/b3` with unverified email (`email_verified: false`).
4. Creating `/bookings/b4` with shadow field `isAdminApproved: true`.
5. Creating `/bookings/b5` with 1.5KB junk document ID (`isValidId` rejection).
6. Updating `/bookings/b1` as non-owner client to change `depositStatus` to `paid`.
7. Updating `/bookings/b1` after `status == 'completed'` by non-admin.
8. Reading another user's `/users/{otherUid}` document.
9. Listing `/bookings` without `where('userId', '==', uid)` filter.
10. Creating `/conversations/c1/messages/m1` when parent `/conversations/c1` does not exist.
11. Reading `/conversations/c1/messages/m1` belonging to another client.
12. Spoofing `createdAt` to a client-chosen past timestamp instead of `request.time`.
