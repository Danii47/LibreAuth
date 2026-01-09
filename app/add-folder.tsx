import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
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
import { ACCOUNT_COLORS } from '@/constants/Colors';
import { TEXTS } from '@/constants/Languages';
import { getColors } from '@/constants/Styles';
import { loadAuthData, saveAuthData } from '@/storage/secureStore';
import { Folder } from '@/types';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { IconPicker } from '@/components/ui/IconPicker';

export default function AddFolderScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(TEXTS.errorTitle, TEXTS.errorMissingName);
      return;
    }

    setLoading(true);

    try {
      const data = await loadAuthData();

      const rootAccounts = data.accounts.filter(acc => !acc.folderId);
      const siblings = [...data.folders, ...rootAccounts];

      const maxPos = siblings.reduce((max, item) => Math.max(max, item.position || -1), -1);

      const newFolder: Folder = {
        id: Date.now().toString(),
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
        position: maxPos + 1,
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

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={router.back} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{TEXTS.newFolder}</Text>
        </View>

        <View style={styles.form}>

          {/* NAME INPUT */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.folderNameLabel}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.headerBorder || '#ccc' }]}
            placeholder={TEXTS.folderNamePlace}
            placeholderTextColor={colors.subtext}
            value={name}
            onChangeText={setName}
          />

          {/* ICON PICKER */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.folderIconLabel}</Text>
          <IconPicker
            selectedIcon={selectedIcon}
            onSelect={setSelectedIcon}
            selectedColor={selectedColor}
            colors={colors}
          />

          {/* COLOR PICKER */}
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.folderColorLabel}</Text>
          <ColorPicker
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
            colors={colors}
          />

          {/* SAVE BUTTON */}
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
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 18, borderRadius: 16, gap: 10,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    marginTop: 10
  },
  saveText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});