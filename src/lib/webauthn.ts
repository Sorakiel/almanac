/** Passkeys need the WebAuthn Credential Management API. */
export function passkeysSupported(): boolean {
  return typeof window !== 'undefined' && 'PublicKeyCredential' in window
}
