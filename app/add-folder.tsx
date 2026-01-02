import { useRouter } from 'expo-router';
import { ArrowLeft, Save, Check } from 'lucide-react-native';
import { useState } from 'react';
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
// Asegúrate de que las rutas a tus constantes sean correctas
import { ACCOUNT_COLORS } from '../constants/Colors';
import { TEXTS } from '../constants/Languages'; // O theme.ts si lo unificaste
import { getColors } from '../constants/Styles'; // O theme.ts
import { loadAuthData, saveAuthData } from '../storage/secureStore';
import { Folder } from '../types';
import { AVAILABLE_ICONS } from '../constants/Icons';
import { AppIcon } from '../components/AppIcon';

export default function AddFolderScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('default');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(TEXTS.errorTitle || 'Error', 'El nombre de la carpeta es obligatorio.');
      return;
    }

    setLoading(true);

    try {
      const data = await loadAuthData();

      const newFolder: Folder = {
        id: Date.now().toString(),
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
        createdAt: Date.now(),
      };

      data.folders.push(newFolder);
      await saveAuthData(data);
      router.back();

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar la carpeta.');
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
          <Text style={[styles.title, { color: colors.text }]}>{TEXTS.newFolder}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>

          {/* Name */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.folderNameLabel}</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: focusedField === 'name' ? selectedColor : colors.headerBorder || '#ccc',
                borderWidth: focusedField === 'name' ? 2 : 1
              }
            ]}
            placeholder="Ej: Finanzas, Juegos..."
            placeholderTextColor={colors.subtext}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />

          {/* Icons */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.folderIconLabel}</Text>
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
                      borderColor: isSelected ? selectedColor : colors.headerBorder || '#ccc',
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
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.folderColorLabel}</Text>
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
            <Text style={styles.saveText}>{loading ? TEXTS.saving : TEXTS.newFolder}</Text>
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
  input: {
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 10
  },
  colorsContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
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
    marginBottom: 20
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
  }
});