import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, StatusBar, Platform } from 'react-native';
import { extractOTPParams } from '../utils/totp'; // Importa tu función
import { getColors } from '../constants/Styles';
import { useColorScheme } from 'react-native';

export default function ScanQrScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    // Cargando permisos...
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 20, fontSize: 18 }}>
          Necesitamos acceso a la cámara para escanear el código QR.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.tint, padding: 15, borderRadius: 10 }}
          onPress={requestPermission}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Conceder Permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: colors.danger }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return; // Evita lecturas múltiples rápidas
    setScanned(true);

    const params = extractOTPParams(data);

    if (params) {
      // ÉXITO: Navegamos a Add Account con los datos (REPLACE para no volver a cámara al dar atrás)
      router.replace({
        pathname: '/add-account',
        params: {
          scannedSecret: params.secret,
          scannedIssuer: params.issuer || '',
          scannedName: params.accountName || ''
        }
      });
    } else {
      Alert.alert(
        "Código no válido",
        "El código QR escaneado no parece ser un código de autenticación válido.",
        [{ text: "OK", onPress: () => setScanned(false) }] // Reseteamos para escanear otro
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

      {/* OVERLAY OSCURO CON HUECO PARA EL QR (Diseño Profesional) */}
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}>
            {/* Esquinas visuales del scanner */}
            <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
            <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
            <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
            <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        <View style={styles.unfocusedContainer}></View>
      </View>

      {/* HEADER FLOTANTE */}
      <View style={styles.headerBtn}>
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
          onPress={() => router.back()}
        >
          <X color="white" size={24} />
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
          Escanea el código QR
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
  // Estilos del Overlay (Hueco cuadrado)
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  middleContainer: { flexDirection: 'row', flex: 1.5 },
  focusedContainer: { flex: 10, position: 'relative' }, // El hueco transparente
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#fff' }
});