import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Eye, EyeOff, FolderOpen } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { ACCOUNT_COLORS } from '@/constants/Colors';
import { TEXTS } from '@/constants/Languages';
import { getColors } from '@/constants/Styles';
import { loadAuthData, saveAuthData } from '@/storage/secureStore';
import { Account, Folder } from '@/types';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { IconPicker } from '@/components/ui/IconPicker';

export default function AddAccountScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);
  
  const { initialFolderId, scannedSecret, scannedIssuer, scannedName, id, name, issuer, secret, icon, color, folderId } = useLocalSearchParams();
  
  const getParam = (p: any) => (Array.isArray(p) ? p[0] : p) || '';

  const [form, setForm] = useState({
    name: getParam(name) || getParam(scannedName),
    issuer: getParam(issuer) || getParam(scannedIssuer),
    secret: getParam(secret) || getParam(scannedSecret),
    color: getParam(color) || ACCOUNT_COLORS[0],
    icon: getParam(icon) || 'default',
    folderId: (getParam(folderId) || (Array.isArray(initialFolderId) ? initialFolderId[0] : initialFolderId)) as string | undefined
  });

  const [folders, setFolders] = useState<Folder[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    loadAuthData().then(d => {
      if (d.folders?.length) setFolders(d.folders);
    });
  }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.secret.trim()) return Alert.alert(TEXTS.errorTitle, TEXTS.errorMissing);
    const cleanSecret = form.secret.replace(/\s/g, '').toUpperCase();
    if (cleanSecret.length < 8) return Alert.alert(TEXTS.errorTitle, TEXTS.errorShort);

    setLoading(true);
    try {
      const data = await loadAuthData();
      const accountId = getParam(id);

      if (accountId) {
        // Edit logic
        const index = data.accounts.findIndex(a => a.id === accountId);
        if (index !== -1) {
          data.accounts[index] = {
            ...data.accounts[index],
            name: form.name.trim(),
            issuer: form.issuer.trim(),
            secret: cleanSecret,
            color: form.color,
            icon: form.icon,
            folderId: form.folderId,
          };
        }
      } else {
        // Create logic
        let siblings = form.folderId
          ? data.accounts.filter(a => a.folderId === form.folderId)
          : [...data.folders, ...data.accounts.filter(a => !a.folderId)];

        const maxPos = siblings.reduce((max, item) => Math.max(max, item.position || -1), -1);

        const newAccount: Account = {
          id: Date.now().toString(),
          name: form.name.trim(),
          issuer: form.issuer.trim(),
          secret: cleanSecret,
          type: 'totp',
          color: form.color,
          icon: form.icon,
          folderId: form.folderId,
          position: maxPos + 1,
          createdAt: Date.now()
        };
        data.accounts.push(newAccount);
      }

      await saveAuthData(data);
      router.back();
    } catch {
      Alert.alert(TEXTS.errorTitle, TEXTS.errorSave);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key: keyof typeof form, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={useColorScheme() === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        <View style={styles.header}>
          <TouchableOpacity onPress={router.back} style={{ padding: 5 }}><ArrowLeft size={24} color={colors.text} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {isEditing ? TEXTS.editAccount : TEXTS.newAccount}
          </Text>
        </View>

        <View style={{ gap: 15 }}>
          <InputLabel label={TEXTS.accNameLabel} value={form.name} onChange={(t: string) => updateForm('name', t)} placeholder={TEXTS.accNamePlace} colors={colors} maxLength={50} />
          <InputLabel label={TEXTS.issuerLabel} value={form.issuer} onChange={(t: string) => updateForm('issuer', t)} placeholder={TEXTS.issuerPlace} colors={colors} maxLength={50} />

          <View>
            <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.secretLabel}</Text>
            <View style={[styles.inputBox, { borderColor: colors.headerBorder, backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { color: colors.text, flex: 1 }]}
                value={form.secret}
                onChangeText={t => updateForm('secret', t.toUpperCase())}
                secureTextEntry={!showSecret}
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowSecret(!showSecret)} style={{ padding: 10 }}>
                {showSecret ? <EyeOff size={20} color={colors.subtext} /> : <Eye size={20} color={colors.subtext} />}
              </TouchableOpacity>
            </View>
          </View>

          {folders.length > 0 && (
            <View>
              <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.folder}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                <FolderChip label={TEXTS.none} selected={!form.folderId} onPress={() => updateForm('folderId', undefined)} color={form.color} colors={colors} />
                {folders.map(f => (
                  <FolderChip key={f.id} label={f.name} selected={form.folderId === f.id} onPress={() => updateForm('folderId', f.id)} color={form.color} colors={colors} icon />
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.iconLabel}</Text>
          <IconPicker selectedIcon={form.icon} onSelect={i => updateForm('icon', i)} selectedColor={form.color} colors={colors} />

          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.colorLabel}</Text>
          <ColorPicker selectedColor={form.color} onSelect={c => updateForm('color', c)} colors={colors} />

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: form.color }]} onPress={handleSave} disabled={loading}>
            <Save size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
              {loading
                ? TEXTS.saving
                : (isEditing ? TEXTS.confirmEdit : TEXTS.save)
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const InputLabel = ({ label, value, onChange, placeholder, colors, maxLength }: any) => (
  <View>
    <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
    <TextInput
      style={[styles.inputBox, styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.headerBorder }]}
      value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.subtext}
      maxLength={maxLength}
    />
  </View>
);

const FolderChip = ({ label, selected, onPress, color, colors, icon }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.chip, { backgroundColor: selected ? color : colors.card, borderColor: selected ? color : colors.headerBorder }]}>
    {icon && <FolderOpen size={16} color={selected ? 'white' : colors.text} style={{ marginRight: 6 }} />}
    <Text style={{ color: selected ? 'white' : colors.text, fontWeight: '600' }}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginLeft: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  input: { padding: 15, fontSize: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  saveBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 16, gap: 10, marginTop: 10, elevation: 4 },
});