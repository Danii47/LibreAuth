import * as SecureStore from "expo-secure-store";
import { AuthData } from "../types";

const STORAGE_KEY = "2fa_auth_data";

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
