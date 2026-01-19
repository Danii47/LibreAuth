import { Buffer } from "buffer";
import HmacSHA1 from "crypto-js/hmac-sha1";
import HmacSHA256 from "crypto-js/hmac-sha256";
import HmacSHA512 from "crypto-js/hmac-sha512";
import Hex from "crypto-js/enc-hex";
import { AccountAlgorithm } from "@/types";

const STEAM_CHARS = "23456789BCDFGHJKMNPQRTVWXY";

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

function computeHOTP({
  keyWord,
  counter,
  algorithm = "SHA1",
  digits = 6
}: { keyWord: any; counter: number; algorithm?: AccountAlgorithm; digits?: number; }): string {
  const counterBuf = getCounterBuffer(counter);
  const counterWord = Hex.parse(counterBuf.toString("hex"));

  let hmacResult;
  switch (algorithm) {
    case "SHA256":
      hmacResult = HmacSHA256(counterWord, keyWord);
      break;
    case "SHA512":
      hmacResult = HmacSHA512(counterWord, keyWord);
      break;
    case "SHA1":
    case "STEAM":
    default:
      hmacResult = HmacSHA1(counterWord, keyWord);
      break;
  }

  const hmacHex = hmacResult.toString(Hex);
  const hmacBuffer = Buffer.from(hmacHex, "hex");

  const offset = hmacBuffer[hmacBuffer.length - 1] & 0xf;

  const binary =
    ((hmacBuffer[offset] & 0x7f) << 24) |
    ((hmacBuffer[offset + 1] & 0xff) << 16) |
    ((hmacBuffer[offset + 2] & 0xff) << 8) |
    (hmacBuffer[offset + 3] & 0xff);

  if (algorithm === "STEAM") {
    let fullCode = binary;
    let code = "";

    for (let i = 0; i < 5; i++) {
      code += STEAM_CHARS.charAt(fullCode % 26);
      fullCode = Math.floor(fullCode / 26);
    }
    return code;
  }
  
  const modulo = Math.pow(10, digits);
  const otp = binary % modulo;

  return otp.toString().padStart(digits, "0");
}

export function generateTOTP({
  secretKey,
  intervalSeconds = 30,
  algorithm = "SHA1",
  digits = 6,
}: { secretKey: string; intervalSeconds?: number; algorithm?: AccountAlgorithm; digits?: number; }): {
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

    const actualCode = computeHOTP({ keyWord, counter: counterActual, algorithm, digits });
    const nextCode = computeHOTP({ keyWord, counter: counterNext, algorithm, digits });

    return { actualCode, nextCode };
  } catch (error) {
    console.error("Error generating TOTP:", error);

    const zeros = "0".repeat(digits);
    return { actualCode: zeros, nextCode: zeros };
  }
}

export function getTimeRemaining(intervalSeconds = 30): number {
  const seconds = Math.floor(Date.now() / 1000);
  return intervalSeconds - (seconds % intervalSeconds);
}

export function extractOTPParams(otpAuthUrl: string): {
  secret: string;
  issuer?: string;
  accountName?: string;
  type: "totp" | "hotp";
  algorithm: AccountAlgorithm;
  digits: number;
  period: number;
  counter: number;
} {
  try {
    const url = new URL(otpAuthUrl);

    if (!url.protocol.startsWith("otpauth")) {
      throw new Error("Invalid protocol");
    }

    const type = url.host.toLowerCase() === "hotp" ? "hotp" : "totp";

    const secret = url.searchParams.get("secret");
    if (!secret) throw new Error("Missing secret");

    const issuerParam = url.searchParams.get("issuer");

    const label = decodeURIComponent(
      url.pathname.replace(/^\/\//, "").slice(1),
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

    const algoParam = url.searchParams.get("algorithm")?.toUpperCase();

    let algorithm: AccountAlgorithm = "SHA1";
    if (algoParam === "SHA256") algorithm = "SHA256";
    else if (algoParam === "SHA512") algorithm = "SHA512";
    else if (algoParam === "STEAM") algorithm = "STEAM";

    const digitsParam = url.searchParams.get("digits");
    const digits = digitsParam ? parseInt(digitsParam, 10) : 6;

    const periodParam = url.searchParams.get("period");
    const period = periodParam ? parseInt(periodParam, 10) : 30;

    const counterParam = url.searchParams.get("counter");
    const counter = counterParam ? parseInt(counterParam, 10) : 0;

    return {
      secret,
      issuer: issuerParam || issuerLabel,
      accountName,
      type,
      algorithm,
      digits,
      period,
      counter,
    };
  } catch (e) {
    console.error("Error parsing OTP URL", e);
    throw e;
  }
}
