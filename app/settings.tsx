import { StyleSheet, Text, View, TouchableOpacity, ScrollView, useColorScheme, StatusBar, Linking, Platform, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';

import { ArrowLeft, Download, Upload, Shield, Info, ChevronRight, Fingerprint } from 'lucide-react-native';
import { getColors } from '../constants/Styles';
import { SettingsOption } from '@/components/SettingsOption';
import { AboutModal } from '@/components/AboutModal';
import { loadAuthData, saveAuthData, getBiometricEnabled, setBiometricEnabled } from '../storage/secureStore';
import { ResultModal } from '@/components/ResultModal';

const { StorageAccessFramework } = FileSystem;

export default function SettingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true); // Estado para el Switch

  // Cargar preferencia de biometría al montar
  useEffect(() => {
    const loadSettings = async () => {
      const enabled = await getBiometricEnabled();
      setIsBiometricEnabled(enabled);
    };
    loadSettings();
  }, []);

  const [resultModal, setResultModal] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'warning',
    title: '',
    message: ''
  });

  const showResult = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setResultModal({ visible: true, type, title, message });
  };

  const closeResult = () => {
    setResultModal(prev => ({ ...prev, visible: false }));
  };

  const toggleBiometric = async (value: boolean) => {
    setIsBiometricEnabled(value);
    await setBiometricEnabled(value);
  };

  const handleExport = async () => {
    try {
      const data = await loadAuthData();
      if ((!data.accounts || data.accounts.length === 0) && (!data.folders || data.folders.length === 0)) {
        showResult('warning', "Sin datos", "No tienes cuentas ni carpetas para exportar.");
        return;
      }

      const backupData = {
        metadata: {
          appName: "LibreAuth",
          version: "1.0",
          createdAt: new Date().toISOString(),
        },
        data: data
      };
      const jsonString = JSON.stringify(backupData, null, 2);
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `libreauth_backup_${dateStr}.json`;

      // Android
      if (Platform.OS === 'android') {
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
          const uri = await StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'application/json'
          );

          await FileSystem.writeAsStringAsync(uri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });

          showResult('success', "Exportación completada", "Tu copia de seguridad se ha guardado correctamente.");
        } else {
          return;
        }

        // iOS
      } else {
        const fileUri = FileSystem.cacheDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
          encoding: FileSystem.EncodingType.UTF8
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Guardar copia de seguridad en Archivos',
            UTI: 'public.json'
          });
        } else {
          showResult('error', "Error", "No se puede compartir en este dispositivo.");
        }
      }

    } catch (error) {
      console.error("Error exportando:", error);
      showResult('error', "Error al exportar", "Hubo un problema al generar el archivo.");
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;

      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      let parsedData;

      try {
        parsedData = JSON.parse(fileContent);
      } catch {
        showResult('error', "Archivo inválido", "El archivo seleccionado no es un JSON válido.");
        return;
      }

      const importedData = parsedData.data || parsedData;

      if (!importedData.accounts && !importedData.folders) {
        showResult('error', "Formato incorrecto", "El archivo no contiene datos válidos de LibreAuth.");
        return;
      }

      const newAccounts = importedData.accounts || [];
      const newFolders = importedData.folders || [];

      const currentData = await loadAuthData();
      let finalAccounts = [...(currentData.accounts || [])];
      let finalFolders = [...(currentData.folders || [])];

      // If there are accounts or folders with the same ID, the imported one will overwrite the existing one.
      newAccounts.forEach((importedAccount: any) => {
        finalAccounts = finalAccounts.filter(account => account.id !== importedAccount.id);
        finalAccounts.push(importedAccount);
      });

      newFolders.forEach((importedFolder: any) => {
        finalFolders = finalFolders.filter(folder => folder.id !== importedFolder.id);
        finalFolders.push(importedFolder);
      });

      await saveAuthData({
        accounts: finalAccounts,
        folders: finalFolders
      });

      showResult(
        'success',
        "Importación completada",
        `Se han importado/actualizado ${newAccounts.length} cuentas y ${newFolders.length} carpetas.`
      );

    } catch (error) {
      console.error("Error importando:", error);
      showResult('error', "Error crítico", "Ocurrió un fallo al leer o procesar el archivo.");
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://github.com/Danii47/LibreAuth/blob/main/PRIVACY.md');
  };

  const showAbout = () => {
    setAboutModalVisible(true);
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: colors.subtext }]}>{title.toUpperCase()}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
          <ArrowLeft color={colors.text} size={26} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* SECTION 0: SECURITY */}
        {renderSectionHeader("Seguridad")}
        <View style={[styles.sectionContainer, { backgroundColor: colors.modalBg }]}>
          <SettingsOption
            icon={<Fingerprint color={colors.text} size={22} />}
            title="Bloqueo Biométrico"
            subtitle="Solicitar FaceID/Huella al abrir"
            onPress={() => toggleBiometric(!isBiometricEnabled)}
            isLast={true}
            colors={colors}
            rightIcon={
              <Switch
                value={isBiometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: "#767577", true: colors.tint }}
                thumbColor={isBiometricEnabled ? "#fff" : "#f4f3f4"}
              />
            }
          />
        </View>

        <View style={{ height: 30 }} />

        {/* SECTION 1: Data management */}
        {renderSectionHeader("Gestión de Claves")}
        <View style={[styles.sectionContainer, { backgroundColor: colors.modalBg }]}>
          <SettingsOption
            icon={<Download color={colors.text} size={22} />}
            title="Exportar Claves"
            subtitle="Guardar copia de seguridad (JSON)"
            onPress={handleExport}
            colors={colors}
            rightIcon={<ChevronRight size={20} color={colors.subtext} opacity={0.5} />}
          />
          <SettingsOption
            icon={<Upload color={colors.text} size={22} />}
            title="Importar Claves"
            subtitle="Restaurar desde un archivo JSON"
            onPress={handleImport}
            isLast={true}
            colors={colors}
            rightIcon={<ChevronRight size={20} color={colors.subtext} opacity={0.5} />}
          />
        </View>

        <View style={{ height: 30 }} />

        {/* SECTION 2: INFORMATION */}
        {renderSectionHeader("Aplicación")}
        <View style={[styles.sectionContainer, { backgroundColor: colors.modalBg }]}>
          <SettingsOption
            icon={<Shield color={colors.text} size={22} />}
            title="Política de Privacidad"
            subtitle="Ver en GitHub"
            onPress={openPrivacyPolicy}
            colors={colors}
          />
          <SettingsOption
            icon={<Info color={colors.text} size={22} />}
            title="Acerca de"
            subtitle="Versión, librerías y créditos"
            onPress={showAbout}
            isLast={true}
            colors={colors}
            rightIcon={<ChevronRight size={20} color={colors.subtext} opacity={0.5} />}
          />
        </View>

        <Text style={{ textAlign: 'center', color: colors.subtext, marginTop: 40, opacity: 0.5 }}>
          LibreAuth v1.0.0
        </Text>

      </ScrollView>

      <AboutModal
        visible={aboutModalVisible}
        onClose={() => setAboutModalVisible(false)}
        colors={colors}
      />

      <ResultModal
        visible={resultModal.visible}
        type={resultModal.type}
        title={resultModal.title}
        message={resultModal.message}
        onClose={closeResult}
        colors={colors}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10
  },
  sectionContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});