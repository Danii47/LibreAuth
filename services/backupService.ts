import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
import { loadAuthData, saveAuthData } from "../storage/secureStore";
import { APP_NAME, APP_VERSION } from "@/constants/AppInformation";

const { StorageAccessFramework } = FileSystem;

type ExportError =
  | "NO_DATA"
  | "CANCELLED"
  | "SHARING_UNAVAILABLE"
  | "UNKNOWN";

type ImportError =
  | "CANCELLED"
  | "INVALID_FORMAT"
  | "UNKNOWN";

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

  importData: async (): Promise<{
    success: boolean;
    count?: number;
    error?: ImportError;
  }> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return { success: false, error: "CANCELLED" };

      const fileContent = await FileSystem.readAsStringAsync(
        result.assets[0].uri
      );
      const parsed = JSON.parse(fileContent);
      const importedData = parsed.data || parsed;

      if (!importedData.accounts && !importedData.folders)
        return { success: false, error: "INVALID_FORMAT" };

      const currentData = await loadAuthData();

      const newAccounts = importedData.accounts || [];
      const newFolders = importedData.folders || [];

      let finalAccounts = [...(currentData.accounts || [])];
      let finalFolders = [...(currentData.folders || [])];

      newAccounts.forEach((impAcc: any) => {
        finalAccounts = finalAccounts.filter((acc) => acc.id !== impAcc.id);
        finalAccounts.push(impAcc);
      });

      newFolders.forEach((impFold: any) => {
        finalFolders = finalFolders.filter((f) => f.id !== impFold.id);
        finalFolders.push(impFold);
      });

      await saveAuthData({ accounts: finalAccounts, folders: finalFolders });
      return { success: true, count: newAccounts.length + newFolders.length };
    } catch (e) {
      console.error(e);
      return { success: false, error: "UNKNOWN" };
    }
  },
};
