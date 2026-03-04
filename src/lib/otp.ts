// Deterministic time-based OTP generation
// Same algorithm runs on client (student view) and server (verification)
const OTP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash;
}

export function generateOTP(certId: string, authCode: string): string {
  const timeWindow = Math.floor(Date.now() / OTP_WINDOW_MS);
  const input = `${certId}:${authCode}:${timeWindow}`;
  const hash = djb2Hash(input);
  return String(hash % 1000000).padStart(6, '0');
}

export function getOTPTimeRemaining(): number {
  return Math.ceil((OTP_WINDOW_MS - (Date.now() % OTP_WINDOW_MS)) / 1000);
}

// Verify OTP - checks current and previous window (to handle edge cases)
export function verifyOTP(certId: string, authCode: string, otp: string): boolean {
  const now = Date.now();
  const currentWindow = Math.floor(now / OTP_WINDOW_MS);
  
  for (let offset = 0; offset >= -1; offset--) {
    const window = currentWindow + offset;
    const input = `${certId}:${authCode}:${window}`;
    const hash = djb2Hash(input);
    const expected = String(hash % 1000000).padStart(6, '0');
    if (expected === otp) return true;
  }
  return false;
}
