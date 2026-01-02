import HmacSHA1 from "crypto-js/hmac-sha1";
import Hex from "crypto-js/enc-hex";

function base32ToBuffer(base32Str: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanStr = base32Str.replace(/=+$/, "").toUpperCase();
  const output: number[] = [];

  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i];
    const value = alphabet.indexOf(char);

    if (value === -1) {
      continue;
    }

    buffer = (buffer << 5) | value;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      output.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }

  return Buffer.from(output);
}

function getCounterBuffer(intervalSeconds: number = 30): Buffer {
  const currentSeconds = Math.floor(Date.now() / 1000);
  const counter = Math.floor(currentSeconds / intervalSeconds);

  const buffer = Buffer.alloc(8);

  buffer.writeUInt32BE(counter, 4);

  return buffer;
}

export function generateTOTP(secretKey: string): string {
  try {
    const keyBuffer = base32ToBuffer(secretKey);

    const timeBuffer = getCounterBuffer();

    const keyHex = keyBuffer.toString("hex");
    const timeHex = timeBuffer.toString("hex");

    const keyWord = Hex.parse(keyHex);
    const timeWord = Hex.parse(timeHex);

    const hmacResult = HmacSHA1(timeWord, keyWord);

    const hmacHex = hmacResult.toString(Hex);
    const hmacBuffer = Buffer.from(hmacHex, "hex");

    const offset = hmacBuffer[hmacBuffer.length - 1] & 0xf;

    const binary =
      ((hmacBuffer[offset] & 0x7f) << 24) |
      ((hmacBuffer[offset + 1] & 0xff) << 16) |
      ((hmacBuffer[offset + 2] & 0xff) << 8) |
      (hmacBuffer[offset + 3] & 0xff);

    const otp = binary % 1000000;

    return otp.toString().padStart(6, "0");
  } catch (error) {
    console.error("Error generando TOTP:", error);
    return "000000";
  }
}

export function getTimeRemaining(): number {
  const seconds = Math.floor(Date.now() / 1000);
  return 30 - (seconds % 30);
}


// Example OTP URL: 
// otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example
export function extractOTPParams(otpAuthUrl: string): { secret: string; issuer?: string; accountName?: string } {
  const url = new URL(otpAuthUrl);
  if (url.protocol !== "otpauth:") {
    throw new Error("Invalid protocol");
  }
  const type = url.hostname;
  if (type !== "totp" && type !== "hotp") {
    throw new Error("Invalid OTP type");
  }
  const secret = url.searchParams.get("secret");
  if (!secret) {
    throw new Error("Missing secret");
  }

  const issuerParam = url.searchParams.get("issuer");
  const label = decodeURIComponent(url.pathname.slice(1));
  let issuerLabel: string | undefined;
  let accountName: string | undefined;

  if (label.includes(":")) {
    const parts = label.split(":");
    issuerLabel = parts[0];
    accountName = parts.slice(1).join(":").trim();
  } else {
    accountName = label;
  }

  const issuer = issuerParam || issuerLabel;

  return { secret, issuer, accountName };
}