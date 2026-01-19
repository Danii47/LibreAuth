import * as SecureStore from "expo-secure-store";
import { File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";
import { AuthData } from "@/types";

const LEGACY_STORE_KEY = "libreauth_secure_data";
const MASTER_KEY_ALIAS = "libreauth_master_key";

const DATA_FILE = new File(Paths.document, "libreauth_vault.enc");

const getMasterKey = async (): Promise<string> => {
  let key = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);

  if (!key) {
    const randomBytes = await Crypto.getRandomBytesAsync(32);

    key = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await SecureStore.setItemAsync(MASTER_KEY_ALIAS, key);
  }

  return key;
};

export const loadAuthData = async (): Promise<AuthData> => {
  try {
    if (DATA_FILE.exists) {
      const fileContent = await DATA_FILE.text();
      const key = await getMasterKey();

      const [ivHex, encryptedContent] = fileContent.split(":");

      if (!ivHex || !encryptedContent) {
        throw new Error("Formato de archivo corrupto");
      }

      const keyHex = CryptoJS.enc.Hex.parse(key);
      const iv = CryptoJS.enc.Hex.parse(ivHex);

      const bytes = CryptoJS.AES.decrypt(encryptedContent, keyHex, { iv: iv });
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error("Falló la desencriptación o el archivo está corrupto");
      }

      return JSON.parse(decryptedString);
    }

    const legacyData = await SecureStore.getItemAsync(LEGACY_STORE_KEY);
    if (legacyData) {
      console.log("⚠️ Migrating legacy data to encrypted file...");
      const parsedData = JSON.parse(legacyData);

      await saveAuthData(parsedData);

      await SecureStore.deleteItemAsync(LEGACY_STORE_KEY);
      console.log("✅ Migration completed and legacy data deleted.");

      return parsedData;
    }

    return { accounts: [], folders: [] };
  } catch (error) {
    console.error("Critical error loading AuthData:", error);
    return { accounts: [], folders: [] };
  }
};

export const saveAuthData = async (data: AuthData): Promise<void> => {
  try {
    const key = await getMasterKey();
    const jsonString = JSON.stringify(data);

    const ivBytes = await Crypto.getRandomBytesAsync(16);
    const ivHex = Array.from(ivBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const keyHex = CryptoJS.enc.Hex.parse(key);
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const encrypted = CryptoJS.AES.encrypt(jsonString, keyHex, {
      iv: iv,
    }).toString();

    const fileContent = `${ivHex}:${encrypted}`;

    await DATA_FILE.write(fileContent);
  } catch (error) {
    console.error("Error saving AuthData:", error);
    throw error;
  }
};

const BIOMETRIC_KEY = "libreauth_biometric_enabled";

export const getBiometricEnabled = async (): Promise<boolean> => {
  const result = await SecureStore.getItemAsync(BIOMETRIC_KEY);
  return result === "true";
};

export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, String(enabled));
};
