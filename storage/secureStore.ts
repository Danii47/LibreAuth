import * as SecureStore from "expo-secure-store";
import { AuthData } from "../types";

const STORAGE_KEY = "libreauth_secure_data";

export const saveAuthData = async (data: AuthData): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await SecureStore.setItemAsync(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Error saving secure data", e);
    throw e;
  }
};

export const loadAuthData = async (): Promise<AuthData> => {
  try {
    const jsonValue = await SecureStore.getItemAsync(STORAGE_KEY);
    if (jsonValue) {
      return JSON.parse(jsonValue);
    }
    
    // if no data found, return empty structure
    return { accounts: [], folders: [] };
  } catch (e) {
    console.error("Error loading data", e);
    return { accounts: [], folders: [] };
  }
};

export const clearAllData = async () => {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
};

const BIOMETRIC_KEY = "auth_biometric_enabled";

export const getBiometricEnabled = async (): Promise<boolean> => {
  const result = await SecureStore.getItemAsync(BIOMETRIC_KEY);
  return result === null ? true : result === "true";
};

export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, String(enabled));
};