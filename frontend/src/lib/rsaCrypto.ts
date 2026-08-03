import { getAuthToken } from "./authStorage";

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:9091";

export type PublicKeyResponse = {
  keyId: string;
  algorithm: string;
  publicKeyPem: string;
  enabled: boolean;
};

let cached: { key: CryptoKey; meta: PublicKeyResponse } | null = null;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i]!);
  }
  return btoa(s);
}

async function getJson<T>(path: string): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path} (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function fetchPublicKey(
  forceRefresh = false
): Promise<PublicKeyResponse> {
  if (!forceRefresh && cached) return cached.meta;
  const meta = await getJson<PublicKeyResponse>("/api/crypto/public-key");
  if (!meta.publicKeyPem) {
    throw new Error("Server did not return an RSA public key");
  }
  const key = await crypto.subtle.importKey(
    "spki",
    pemToArrayBuffer(meta.publicKeyPem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  cached = { key, meta };
  return meta;
}

export async function encryptRsaOaep(plaintext: string): Promise<string> {
  const meta = await fetchPublicKey();
  if (!meta.enabled) {
    return plaintext;
  }
  if (!cached) {
    await fetchPublicKey(true);
  }
  const cipher = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    cached!.key,
    new TextEncoder().encode(plaintext)
  );
  return bufferToBase64(cipher);
}

export function clearPublicKeyCache() {
  cached = null;
}

export async function isRsaEnabled(): Promise<boolean> {
  const meta = await fetchPublicKey();
  return meta.enabled;
}
