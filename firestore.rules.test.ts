// Adversarial Dirty Dozen security rule verification specification
export const dirtyDozenPayloads = [
  { name: 'Unauthenticated booking write', path: '/bookings/b1', expected: 'PERMISSION_DENIED' },
  { name: 'Spoofed userId on booking create', path: '/bookings/b2', payload: { userId: 'victim_uid' }, expected: 'PERMISSION_DENIED' },
  { name: 'Unverified email booking write', path: '/bookings/b3', auth: { uid: 'u1', email_verified: false }, expected: 'PERMISSION_DENIED' },
  { name: 'Shadow field injection on booking', path: '/bookings/b4', payload: { isAdminApproved: true }, expected: 'PERMISSION_DENIED' },
  { name: 'Oversized document ID poisoning', path: `/bookings/${'x'.repeat(1500)}`, expected: 'PERMISSION_DENIED' },
  { name: 'Non-owner depositStatus mutation', path: '/bookings/b1', payload: { depositStatus: 'paid' }, expected: 'PERMISSION_DENIED' },
  { name: 'Mutating completed booking by client', path: '/bookings/b1', existing: { status: 'completed' }, expected: 'PERMISSION_DENIED' },
  { name: 'Cross-user PII profile read', path: '/users/other_uid', expected: 'PERMISSION_DENIED' },
  { name: 'Unscoped bookings list query', path: '/bookings', query: 'all', expected: 'PERMISSION_DENIED' },
  { name: 'Orphaned message without conversation parent', path: '/conversations/missing/messages/m1', expected: 'PERMISSION_DENIED' },
  { name: 'Cross-client message read', path: '/conversations/other_client/messages/m1', expected: 'PERMISSION_DENIED' },
  { name: 'Client-forged createdAt timestamp', path: '/bookings/b5', payload: { createdAt: '2020-01-01T00:00:00Z' }, expected: 'PERMISSION_DENIED' },
];
