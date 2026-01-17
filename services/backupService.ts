import { APP_NAME, APP_VERSION } from "@/constants/AppInformation";
import { loadAuthData, saveAuthData } from "@/storage/secureStore";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { processImportFile } from "./importers";
import { ExportError, ImportError } from "@/types";

const { StorageAccessFramework } = FileSystem;



export const BackupService = {
  exportData: async (): Promise<{ success: boolean; error?: ExportError }> => {
    try {
      const data = await loadAuthData();
      if (
        (!data.accounts || data.accounts.length === 0) &&
        (!data.folders || data.folders.length === 0)
      ) {
        return { success: false, error: "NO_DATA" };
      }

      const backupData = {
        metadata: {
          appName: APP_NAME,
          version: APP_VERSION,
          createdAt: new Date().toISOString(),
        },
        data: data,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `libreauth_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;

      if (Platform.OS === "android") {
        const permissions =
          await StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) return { success: false, error: "CANCELLED" };

        const uri = await StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          "application/json"
        );
        await FileSystem.writeAsStringAsync(uri, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        return { success: true };
      } else {
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/json",
            UTI: "public.json",
          });
          return { success: true };
        } else {
          return { success: false, error: "SHARING_UNAVAILABLE" };
        }
      }
    } catch (e) {
      console.error(e);
      return { success: false, error: "UNKNOWN" };
    }
  },

  importData: async (): Promise<{ success: boolean; count?: number; error?: ImportError }> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled) return { success: false, error: "CANCELLED" };

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      // Is LibreAuth native backup?
      try {
        const json = JSON.parse(fileContent);
        if (Array.isArray(json.accounts) && Array.isArray(json.folders)) {
          await saveAuthData(json);
          return { success: true, count: json.accounts.length };
        }
      } catch {
        // Not valid JSON, proceed to external importers
      }

      const importResult = await processImportFile(fileContent);

      if (importResult.success && importResult.accounts.length > 0) {
        const currentData = await loadAuthData();
        
        const allItems = [...currentData.accounts, ...currentData.folders];
        const maxPosition = allItems.reduce((max, item) => Math.max(max, item.position || 0), -1);

        const newAccounts = importResult.accounts.map((acc, index) => ({
          ...acc,
          position: maxPosition + 1 + index
        }));

        const mergedAccounts = [...currentData.accounts, ...newAccounts];
        
        await saveAuthData({
          ...currentData,
          accounts: mergedAccounts
        });

        return { success: true, count: importResult.count };
      }

      return { success: false, error: importResult.error };

    } catch (error) {
      console.error(error);
      return { success: false, error: 'UNKNOWN' };
    }
  }
};
