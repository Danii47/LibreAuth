import { AboutModal } from '@/components/AboutModal';
import { ResultModal } from '@/components/ResultModal';
import { SettingsOption } from '@/components/SettingsOption';
import { BackupService } from '@/services/backupService';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Download, Fingerprint, Info, Shield, Upload } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { getColors } from '../constants/Styles';
import { getBiometricEnabled, setBiometricEnabled } from '../storage/secureStore';
import { APP_NAME, APP_PRIVACY_POLICY_URL, APP_VERSION } from '@/constants/AppInformation';
import { TEXTS } from '@/constants/Languages';

export default function SettingsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [aboutVisible, setAboutVisible] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [modal, setModal] = useState({ visible: false, type: 'success' as any, title: '', message: '' });

  useEffect(() => { getBiometricEnabled().then(setBiometric); }, []);

  const toggleBiometric = async (val: boolean) => {
    setBiometric(val);
    await setBiometricEnabled(val);
  };

  const showMsg = (type: 'success' | 'error' | 'warning', title: string, msg: string) => {
    setModal({ visible: true, type, title, message: msg });
  };

  const handleExport = async () => {
    const res = await BackupService.exportData();
    if (res.success) showMsg('success', 'Exportación completada', 'Copia guardada correctamente.');
    else if (res.error === 'NO_DATA') showMsg('warning', 'Sin datos', 'Nada que exportar.');
    else if (res.error !== 'CANCELLED') showMsg('error', 'Error', 'Fallo al exportar.');
  };

  const handleImport = async () => {
    const res = await BackupService.importData();
    if (res.success) showMsg('success', 'Importación completada', `Datos actualizados (${res.count} items).`);
    else if (res.error === 'INVALID_FORMAT') showMsg('error', 'Archivo inválido', 'Formato incorrecto.');
    else if (res.error !== 'CANCELLED') showMsg('error', 'Error', 'Fallo al importar.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={router.back} style={{ padding: 5 }}><ArrowLeft color={colors.text} size={26} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{TEXTS.settings}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* SECURITY */}
        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>{TEXTS.security}</Text>
        <View style={[styles.sectionContainer, { backgroundColor: colors.modalBg }]}>
          <SettingsOption
            icon={<Fingerprint color={colors.text} size={22} />}
            title={TEXTS.biometricBlockTitle}
            subtitle={TEXTS.biometricBlockSubtitle}
            onPress={() => toggleBiometric(!biometric)}
            isLast colors={colors}
            rightIcon={<Switch value={biometric} onValueChange={toggleBiometric} trackColor={{ false: "#767577", true: colors.tint }} />}
          />
        </View>

        <View style={{ height: 30 }} />

        {/* KEYS MANAGEMENT */}
        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>{TEXTS.keysManagement}</Text>
        <View style={[styles.sectionContainer, { backgroundColor: colors.modalBg }]}>
          <SettingsOption
            icon={<Download color={colors.text} size={22} />}
            title={TEXTS.exportKeys}
            onPress={handleExport}
            colors={colors}
            rightIcon={<ChevronRight size={20} color={colors.subtext} opacity={0.5} />}
          />
          <SettingsOption
            icon={<Upload color={colors.text} size={22} />}
            title={TEXTS.importKeys}
            onPress={handleImport}
            isLast colors={colors}
            rightIcon={<ChevronRight size={20} color={colors.subtext} opacity={0.5} />}
          />
        </View>

        <View style={{ height: 30 }} />

        {/* APP INFORMATION */}
        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>{TEXTS.app}</Text>
        <View style={[styles.sectionContainer, { backgroundColor: colors.modalBg }]}>
          <SettingsOption
            icon={<Shield color={colors.text} size={22} />}
            title={TEXTS.privacyPolicy}
            onPress={() => Linking.openURL(APP_PRIVACY_POLICY_URL)}
            colors={colors}
          />
          <SettingsOption
            icon={<Info color={colors.text} size={22} />}
            title={TEXTS.about}
            onPress={() => setAboutVisible(true)}
            isLast
            colors={colors}
            rightIcon={<ChevronRight size={20} color={colors.subtext} opacity={0.5} />}
          />
        </View>

        <Text style={{ textAlign: 'center', color: colors.subtext, marginTop: 40, opacity: 0.5 }}>{APP_NAME} {APP_VERSION}</Text>
      </ScrollView>

      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} colors={colors} />
      <ResultModal visible={modal.visible} type={modal.type} title={modal.title} message={modal.message} onClose={() => setModal(m => ({ ...m, visible: false }))} colors={colors} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, paddingTop: 60, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: 'bold' },
  sectionHeader: { fontSize: 13, fontWeight: 'bold', marginBottom: 10, marginLeft: 10 },
  sectionContainer: { borderRadius: 12, overflow: 'hidden' },
});