import { Buffer } from 'buffer';
import { useEffect, useState, useRef, useCallback } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import * as SystemUI from 'expo-system-ui';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppState, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Fingerprint, Lock, KeyRound } from 'lucide-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getColors } from '../constants/Styles';
import { getBiometricEnabled } from '../storage/secureStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

global.Buffer = Buffer;

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const appState = useRef(AppState.currentState);

  const [isLocked, setIsLocked] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  const authenticate = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear LibreAuth',
        fallbackLabel: 'Usar PIN',
        disableDeviceFallback: false,
        cancelLabel: 'Cancelar'
      });

      if (result.success) {
        setIsLocked(false);
      }
    } catch (error) {
      console.error("Auth error", error);
    }
  }, []);

  const checkSecurityAndLock = useCallback(async () => {
    const isEnabled = await getBiometricEnabled();
    if (isEnabled) {
      setIsLocked(true);
      authenticate();
    } else {
      setIsLocked(false);
    }
  }, [authenticate]);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      await checkSecurityAndLock();
    })();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        await checkSecurityAndLock();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkSecurityAndLock]);

  const NavTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NavTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'default',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="add-account" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-folder" options={{ presentation: 'modal' }} />
          <Stack.Screen name="folder/[id]" />
          <Stack.Screen name="scan-qr" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>

        <StatusBar style="auto" />

        {/* BLOCK SCREEN */}
        {isLocked && (
          <View style={[styles.lockOverlay, { backgroundColor: colors.background }]}>
            <View style={styles.lockContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.modalBg }]}>
                <Lock size={64} color={colors.tint} />
              </View>

              <Text style={[styles.lockTitle, { color: colors.text }]}>LibreAuth bloqueado</Text>
              <Text style={[styles.lockSubtitle, { color: colors.subtext }]}>
                {isBiometricSupported
                  ? "Verifica tu identidad para acceder."
                  : "Introduce tu PIN o patrón para acceder."}
              </Text>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: colors.tint }]}
                onPress={authenticate}
              >
                {isBiometricSupported ? (
                  <Fingerprint size={24} color="white" style={{ marginRight: 10 }} />
                ) : (
                  <KeyRound size={24} color="white" style={{ marginRight: 10 }} />
                )}

                <Text style={styles.authButtonText}>Desbloquear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    alignItems: 'center',
    padding: 40,
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  lockTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 4,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});