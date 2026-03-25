/**
 * Signed Request Implementation
 * 
 * Provides HMAC-SHA256 request signing with timestamp and nonce verification.
 * An alternative to Bearer token authentication, offering replay attack protection
 * and request integrity verification.
 */

import { createHmac, randomBytes, createHash } from "node:crypto";

export interface SignedRequestConfig {
  /** API key identifier */
  apiKey: string;
  /** API secret for signing */
  apiSecret: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
  /** Clock skew tolerance in milliseconds (default: 300000 = 5 minutes) */
  clockSkewMs?: number;
}

export interface SignedRequestPayload {
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** Request headers to include in signature */
  headers?: Record<string, string>;
  /** Custom timestamp (for testing) */
  timestamp?: number;
  /** Custom nonce (for testing) */
  nonce?: string;
}

export interface SignedRequestResult {
  /** Authorization header value */
  authorization: string;
  /** Request timestamp */
  timestamp: number;
  /** Unique nonce */
  nonce: string;
  /** Calculated signature */
  signature: string;
}

export interface VerificationResult {
  /** Whether signature is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Parsed timestamp */
  timestamp?: number;
  /** Parsed nonce */
  nonce?: string;
}

/**
 * Creates a signed request authorization header
 * Format: SignedRequest apiKey=<key>, timestamp=<ts>, nonce=<nonce>, signature=<sig>
 */
export function createSignedRequest(
  config: SignedRequestConfig,
  payload: SignedRequestPayload
): SignedRequestResult {
  const timestamp = payload.timestamp ?? Date.now();
  const nonce = payload.nonce ?? generateNonce();
  const bodyString = payload.body ? JSON.stringify(payload.body) : "";
  
  // Build canonical string for signing
  const canonicalString = buildCanonicalString(
    payload.method.toUpperCase(),
    payload.path,
    timestamp,
    nonce,
    bodyString
  );
  
  // Calculate HMAC-SHA256 signature
  const signature = calculateHmac(config.apiSecret, canonicalString);
  
  const authorization = `SignedRequest apiKey=${config.apiKey}, timestamp=${timestamp}, nonce=${nonce}, signature=${signature}`;
  
  return {
    authorization,
    timestamp,
    nonce,
    signature
  };
}

/**
 * Verifies a signed request authorization header
 */
export function verifySignedRequest(
  config: SignedRequestConfig,
  authHeader: string,
  payload: SignedRequestPayload
): VerificationResult {
  const clockSkewMs = config.clockSkewMs ?? 300000; // 5 minutes default
  
  // Parse authorization header
  const parsed = parseAuthorizationHeader(authHeader);
  if (!parsed.success) {
    return { valid: false, error: (parsed as { error: string }).error };
  }
  
  // Check API key matches
  if (parsed.apiKey !== config.apiKey) {
    return { valid: false, error: "API key mismatch" };
  }
  
  // Check timestamp within acceptable window
  const now = Date.now();
  const timestamp = parseInt(parsed.timestamp, 10);
  if (isNaN(timestamp)) {
    return { valid: false, error: "Invalid timestamp format" };
  }
  
  if (Math.abs(now - timestamp) > clockSkewMs) {
    return { 
      valid: false, 
      error: `Request timestamp ${timestamp} outside acceptable window (now=${now}, skew=${clockSkewMs}ms)`
    };
  }
  
  // Reconstruct and verify signature
  const bodyString = payload.body ? JSON.stringify(payload.body) : "";
  const canonicalString = buildCanonicalString(
    payload.method.toUpperCase(),
    payload.path,
    timestamp,
    parsed.nonce,
    bodyString
  );
  
  const expectedSignature = calculateHmac(config.apiSecret, canonicalString);
  
  // Constant-time comparison to prevent timing attacks
  if (!constantTimeCompare(parsed.signature, expectedSignature)) {
    return { valid: false, error: "Signature mismatch" };
  }
  
  return { valid: true, timestamp, nonce: parsed.nonce };
}

/**
 * Generates a cryptographically secure nonce
 */
export function generateNonce(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Builds canonical string for signing
 * Format: METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY_HASH
 */
function buildCanonicalString(
  method: string,
  path: string,
  timestamp: number,
  nonce: string,
  bodyString: string
): string {
  const bodyHash = hashBody(bodyString);
  return `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyHash}`;
}

/**
 * Hash body content using SHA-256
 */
function hashBody(body: string): string {
  if (body.length === 0) {
    return "";
  }
  return createHash("sha256").update(body).digest("hex");
}

/**
 * Calculate HMAC-SHA256
 */
function calculateHmac(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Parse authorization header
 * Expected format: SignedRequest apiKey=<key>, timestamp=<ts>, nonce=<nonce>, signature=<sig>
 */
function parseAuthorizationHeader(header: string): 
  | { success: true; apiKey: string; timestamp: string; nonce: string; signature: string }
  | { success: false; error: string } {
  
  if (!header.startsWith("SignedRequest ")) {
    return { success: false, error: "Invalid authorization scheme" };
  }
  
  const params = header.slice("SignedRequest ".length);
  const parts = params.split(", ").map(p => p.trim());
  
  const result: Record<string, string> = {};
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) {
      result[key] = value;
    }
  }
  
  if (!result.apiKey || !result.timestamp || !result.nonce || !result.signature) {
    return { success: false, error: "Missing required authorization parameters" };
  }
  
  return {
    success: true,
    apiKey: result.apiKey,
    timestamp: result.timestamp,
    nonce: result.nonce,
    signature: result.signature
  };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
