import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, StatusBar, useColorScheme } from 'react-native';
import { extractOTPParams } from '../utils/totp';
import { getColors } from '../constants/Styles';
import { TEXTS } from '@/constants/Languages';

export default function ScanQrScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 20, fontSize: 18 }}>
          {TEXTS.cameraAccessMsg}
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.tint, padding: 15, borderRadius: 10 }}
          onPress={requestPermission}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>{TEXTS.grantPermission}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.danger }}>{TEXTS.cancel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const params = extractOTPParams(data)!;

      router.replace({
        pathname: '/add-account',
        params: {
          scannedSecret: params.secret,
          scannedIssuer: params.issuer || '',
          scannedName: params.accountName || ''
        }
      });
    } catch {
      Alert.alert(
        TEXTS.invalidCode,
        TEXTS.invalidCodeMsg,
        [{ text: TEXTS.ok, onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}>
            <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
            <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
            <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
            <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        <View style={styles.unfocusedContainer}></View>
      </View>

      <View style={styles.headerBtn}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
          onPress={() => router.back()}
        >
          <X color="white" size={24} />
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
          {TEXTS.scanQR2}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  headerBtn: { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center' },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    position: 'absolute', left: 20, top: 0
  },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  middleContainer: { flexDirection: 'row', flex: 1.5 },
  focusedContainer: { flex: 10, position: 'relative' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#fff' }
});