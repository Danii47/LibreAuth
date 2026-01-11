import HmacSHA1 from "crypto-js/hmac-sha1";
import Hex from "crypto-js/enc-hex";

function base32ToBuffer(base32Str: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  const cleanStr = base32Str.replace(/[\s=]+/g, "").toUpperCase();
  const output: number[] = [];

  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < cleanStr.length; i++) {
    const value = alphabet.indexOf(cleanStr[i]);
    if (value === -1) continue;

    buffer = (buffer << 5) | value;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      output.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }
  return Buffer.from(output);
}

function getCounterBuffer(counter: number): Buffer {
  const buffer = Buffer.alloc(8);

  buffer.writeUInt32BE(counter, 4);
  return buffer;
}

function computeHOTP(keyWord: any, counter: number): string {
  const counterBuf = getCounterBuffer(counter);
  const counterWord = Hex.parse(counterBuf.toString("hex"));

  const hmacResult = HmacSHA1(counterWord, keyWord);

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
}

export function generateTOTP(
  secretKey: string,
  intervalSeconds: number = 30
): {
  actualCode: string;
  nextCode: string;
} {
  try {
    const currentSeconds = Math.floor(Date.now() / 1000);
    const counterActual = Math.floor(currentSeconds / intervalSeconds);
    const counterNext = counterActual + 1;

    const keyBuffer = base32ToBuffer(secretKey);
    const keyHex = keyBuffer.toString("hex");
    const keyWord = Hex.parse(keyHex);

    const actualCode = computeHOTP(keyWord, counterActual);
    const nextCode = computeHOTP(keyWord, counterNext);

    return { actualCode, nextCode };
  } catch (error) {
    console.error("Error generando TOTP:", error);
    return { actualCode: "000000", nextCode: "000000" };
  }
}

export function getTimeRemaining(intervalSeconds: number = 30): number {
  const seconds = Math.floor(Date.now() / 1000);
  return intervalSeconds - (seconds % intervalSeconds);
}

export function extractOTPParams(otpAuthUrl: string): {
  secret: string;
  issuer?: string;
  accountName?: string;
} {
  try {
    const url = new URL(otpAuthUrl);
    if (!url.protocol.startsWith("otpauth")) {
      throw new Error("Invalid protocol");
    }

    const secret = url.searchParams.get("secret");
    if (!secret) throw new Error("Missing secret");

    const issuerParam = url.searchParams.get("issuer");

    const label = decodeURIComponent(
      url.pathname.replace(/^\/\//, "").slice(1)
    );

    let issuerLabel: string | undefined;
    let accountName: string | undefined;

    if (label.includes(":")) {
      const parts = label.split(":");
      issuerLabel = parts[0];
      accountName = parts.slice(1).join(":").trim();
    } else {
      accountName = label;
    }

    return {
      secret,
      issuer: issuerParam || issuerLabel,
      accountName,
    };
  } catch (e) {
    console.error("Error parsing OTP URL", e);
    throw e;
  }
}
