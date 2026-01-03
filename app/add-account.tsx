import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Check, FolderOpen, Eye, EyeOff } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StatusBar,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { ACCOUNT_COLORS } from '../constants/Colors';
import { TEXTS } from '../constants/Languages'; // Asegúrate que esta ruta es correcta
import { getColors } from '../constants/Styles'; // Asegúrate que esta ruta es correcta
import { loadAuthData, saveAuthData } from '../storage/secureStore';
import { Account, Folder } from '../types';
import { AVAILABLE_ICONS } from '../constants/Icons';
import { AppIcon } from '../components/AppIcon';


export default function AddAccountScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('default');

  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);

  const { initialFolderId, scannedSecret, scannedIssuer, scannedName } = useLocalSearchParams();

  const getParam = (p: string | string[] | undefined) => (Array.isArray(p) ? p[0] : p) || '';

  const [name, setName] = useState(getParam(scannedName));
  const [issuer, setIssuer] = useState(getParam(scannedIssuer));
  const [secret, setSecret] = useState(getParam(scannedSecret));

  useEffect(() => {
    if (scannedSecret) setSecret(getParam(scannedSecret));
    if (scannedName) setName(getParam(scannedName));
    if (scannedIssuer) setIssuer(getParam(scannedIssuer));
  }, [scannedSecret, scannedName, scannedIssuer]);

  useEffect(() => {
    const fetchFolders = async () => {
      const data = await loadAuthData();
      if (data.folders && data.folders.length > 0) {
        setFolders(data.folders);

        if (initialFolderId) {
          const initId = Array.isArray(initialFolderId) ? initialFolderId[0] : initialFolderId;
          setSelectedFolderId(initId);
        }
      }
    };
    fetchFolders();
  }, [initialFolderId]);

  const handleSave = async () => {
    if (!name.trim() || !secret.trim()) {
      Alert.alert(TEXTS.errorTitle, TEXTS.errorMissing);
      return;
    }

    const cleanSecret = secret.replace(/\s/g, '').toUpperCase();

    if (cleanSecret.length < 8) {
      Alert.alert(TEXTS.errorTitle, TEXTS.errorShort);
      return;
    }

    setLoading(true);

    try {
      const data = await loadAuthData();

      let siblings: { position: number }[] = [];

      if (selectedFolderId) {
        siblings = data.accounts.filter(acc => acc.folderId === selectedFolderId);
      } else {
        const rootAccounts = data.accounts.filter(acc => !acc.folderId);
        siblings = [...data.folders, ...rootAccounts];
      }

      const maxPosition = Math.max(...siblings.map(sib => sib.position), -1);

      const newPosition = maxPosition + 1;

      const newAccount: Account = {
        id: Date.now().toString(),
        name: name.trim(),
        issuer: issuer.trim(),
        secret: cleanSecret,
        type: 'totp',
        color: selectedColor,
        createdAt: Date.now(),
        icon: selectedIcon,
        position: newPosition,
        folderId: selectedFolderId
      };

      data.accounts.push(newAccount);
      await saveAuthData(data);
      router.back();

    } catch (error) {
      console.error(error);
      Alert.alert(TEXTS.errorTitle, TEXTS.errorSave);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{TEXTS.newAccount}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.accNameLabel}</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: focusedField === 'name' ? selectedColor : colors.headerBorder,
                borderWidth: 2
              }
            ]}
            placeholder={TEXTS.accNamePlace}
            placeholderTextColor={colors.subtext}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />

          {/* Issuer */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.issuerLabel}</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: focusedField === 'issuer' ? selectedColor : colors.headerBorder,
                borderWidth: 2
              }
            ]}
            placeholder={TEXTS.issuerPlace}
            placeholderTextColor={colors.subtext}
            value={issuer}
            onChangeText={setIssuer}
            onFocus={() => setFocusedField('issuer')}
            onBlur={() => setFocusedField(null)}
          />

          {/* Secret */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.secretLabel}</Text>
          <View style={[
            styles.inputContainer,
            {
              backgroundColor: colors.card,
              borderColor: focusedField === 'secret' ? selectedColor : colors.headerBorder,
              borderWidth: 2
            }
          ]}>
            <TextInput
              style={[
                styles.inputInside,
                { color: colors.text },
                !showSecret && { fontFamily: undefined }
              ]}
              placeholder={TEXTS.secretPlace}
              placeholderTextColor={colors.subtext}
              value={secret}
              onChangeText={setSecret}

              autoCapitalize={showSecret ? "characters" : "none"}
              autoCorrect={false}

              secureTextEntry={!showSecret}

              onFocus={() => setFocusedField('secret')}
              onBlur={() => setFocusedField(null)}
            />

            {/* Eye button */}
            <TouchableOpacity onPress={() => setShowSecret(!showSecret)} style={{ padding: 10 }}>
              {showSecret ? (
                <EyeOff size={20} color={colors.subtext} />
              ) : (
                <Eye size={20} color={colors.subtext} />
              )}
            </TouchableOpacity>
          </View>

          {/* Folder selector */}
          {folders.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.subtext }]}>Carpeta (Opcional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.folderScroll}
              >
                <TouchableOpacity
                  style={[
                    styles.folderChip,
                    {
                      backgroundColor: !selectedFolderId ? selectedColor : colors.card,
                      borderColor: !selectedFolderId ? selectedColor : colors.headerBorder,
                      borderWidth: 1
                    }
                  ]}
                  onPress={() => setSelectedFolderId(undefined)}
                >
                  <Text style={{
                    color: !selectedFolderId ? 'white' : colors.text,
                    fontWeight: '600'
                  }}>
                    Ninguna
                  </Text>
                </TouchableOpacity>

                {/* Folders list */}
                {folders.map((folder) => {
                  const isActive = selectedFolderId === folder.id;
                  const chipColor = isActive ? selectedColor : colors.headerBorder;

                  return (
                    <TouchableOpacity
                      key={folder.id}
                      style={[
                        styles.folderChip,
                        {
                          backgroundColor: isActive ? selectedColor : colors.card,
                          borderColor: chipColor,
                          borderWidth: 1
                        }
                      ]}
                      onPress={() => setSelectedFolderId(folder.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <FolderOpen size={16} color={isActive ? 'white' : colors.text} />
                        <Text style={{
                          color: isActive ? 'white' : colors.text,
                          fontWeight: '600'
                        }}>
                          {folder.name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Iconos */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.iconLabel}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iconsScroll}
          >
            {AVAILABLE_ICONS.map((iconKey) => {
              const isSelected = selectedIcon === iconKey;
              return (
                <TouchableOpacity
                  key={iconKey}
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: isSelected ? selectedColor : colors.card,
                      borderColor: isSelected ? selectedColor : colors.headerBorder,
                      borderWidth: 1
                    }
                  ]}
                  onPress={() => setSelectedIcon(iconKey)}
                >
                  <AppIcon
                    name={iconKey}
                    size={24}
                    color={isSelected ? 'white' : colors.text}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Colors */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.colorLabel}</Text>
          <View style={styles.colorsContainer}>
            {ACCOUNT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorCircle, { backgroundColor: color }]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && <Check size={16} color="white" strokeWidth={3} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: selectedColor }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Save size={20} color="white" />
            <Text style={styles.saveText}>{loading ? TEXTS.saving : TEXTS.save}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop: 10 },
  backBtn: { marginRight: 15, padding: 5 },
  title: { fontSize: 24, fontWeight: 'bold' },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
  colorsContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 25 },
  colorCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2
  },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 18, borderRadius: 16, gap: 10,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  saveText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  iconsScroll: {
    paddingVertical: 5,
    gap: 12,
    marginBottom: 5
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  folderScroll: {
    paddingVertical: 5,
    gap: 10,
    marginBottom: 5
  },
  folderChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    paddingRight: 5
  },
  inputInside: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  input: {
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 10
  },
});