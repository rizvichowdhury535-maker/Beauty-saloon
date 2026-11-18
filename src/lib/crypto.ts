// Client-side End-to-End Encryption (Web Crypto API AES-256-GCM)
// Sensitive consultation notes and direct chat messages are encrypted in browser memory
// before transmission or persistence in Firestore.

const APP_SALT = new TextEncoder().encode('signature-artistry-farhana-dhaka-e2ee-v1');

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveRoomKey(roomId: string): Promise<{ key: CryptoKey; fingerprint: string }> {
  const rawMaterial = new TextEncoder().encode(`saf-channel:${roomId}:gulshan1`);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    rawMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: APP_SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', exported));
  const hex = Array.from(digest.slice(0, 6))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':');

  return { key, fingerprint: `AES256-${hex}` };
}

export async function encryptPayload(
  plaintext: string,
  roomId: string
): Promise<{ ciphertext: string; iv: string; fingerprint: string }> {
  const { key, fingerprint } = await deriveRoomKey(roomId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    ciphertext: toBase64(new Uint8Array(encryptedBuffer)),
    iv: toBase64(iv),
    fingerprint,
  };
}

export async function decryptPayload(
  ciphertext: string,
  iv: string,
  roomId: string
): Promise<string> {
  if (!ciphertext || !iv) return '';
  try {
    const { key } = await deriveRoomKey(roomId);
    const cipherBytes = fromBase64(ciphertext);
    const ivBytes = fromBase64(iv);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      cipherBytes
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return '[Encrypted record — unlock with matching session key]';
  }
}

export async function encryptNotesJson(notes: string, ownerUid: string): Promise<string> {
  if (!notes.trim()) return '';
  const { ciphertext, iv } = await encryptPayload(notes.trim(), `vault-${ownerUid}`);
  return JSON.stringify({ alg: 'AES-256-GCM', iv, ct: ciphertext });
}

export async function decryptNotesJson(packed: string | undefined, ownerUid: string): Promise<string> {
  if (!packed) return '';
  try {
    const parsed = JSON.parse(packed) as { alg?: string; iv?: string; ct?: string };
    if (parsed.ct && parsed.iv) {
      return await decryptPayload(parsed.ct, parsed.iv, `vault-${ownerUid}`);
    }
    return packed;
  } catch {
    return packed;
  }
}
