import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { X, Check, ChevronDown, ChevronUp, FolderOpen, Save } from "lucide-react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { getColors } from "@/constants/Styles";
import { TEXTS } from "@/constants/Languages";
import { loadAuthData, saveAuthData } from "@/storage/secureStore";
import { Account, AccountAlgorithm, AccountType, Folder } from "@/types";
import { IconPicker } from "@/components/ui/IconPicker";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { CustomInput } from "@/components/CustomInput";
import { SelectionGroup } from "@/components/SelectionGroup";
import { getParam } from "@/utils";
import { ACCOUNT_COLORS } from "@/constants/Colors";

interface AccountFormState {
  // Basic
  name: string;
  issuer: string;
  secret: string;
  icon: string;
  color: string;

  // Advanced
  type: AccountType;
  algorithm: AccountAlgorithm;
  digits: number;
  period: string;
  counter: string;

  folderId?: string;
}

export default function AddAccountScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);

  const {
    initialFolderId, scannedSecret, scannedIssuer, scannedName,
    scannedType, scannedAlgorithm, scannedDigits, scannedPeriod, scannedCounter,
    id, name, issuer, secret, icon, color, folderId
  } = useLocalSearchParams();

  const [form, setForm] = useState<AccountFormState>({
    name: getParam(name) || getParam(scannedName),
    issuer: getParam(issuer) || getParam(scannedIssuer),
    secret: getParam(secret) || getParam(scannedSecret),
    color: getParam(color) || ACCOUNT_COLORS[0],
    icon: getParam(icon) || 'default',
    
    type: (getParam(scannedType) as AccountType) || "totp",
    algorithm: (getParam(scannedAlgorithm) as AccountAlgorithm) || "SHA1",
    digits: getParam(scannedDigits) ? parseInt(getParam(scannedDigits) as string) : 6,
    period: getParam(scannedPeriod) || "30",
    counter: getParam(scannedCounter) || "0",

    folderId: (getParam(folderId) || (Array.isArray(initialFolderId) ? initialFolderId[0] : initialFolderId)) as string | undefined
  });

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(id);

  const updateForm = (key: keyof AccountFormState, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleAdvanced = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAdvanced(!showAdvanced);
  };

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
            type: form.type,
            algorithm: form.algorithm,
            digits: form.digits,
            period: form.type === "totp" ? parseInt(form.period) || 30 : undefined,
            counter: form.type === "hotp" ? parseInt(form.counter) || 0 : undefined,
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
          type: form.type,
          algorithm: form.algorithm,
          digits: form.digits,
          period: form.type === "totp" ? parseInt(form.period) || 30 : undefined,
          counter: form.type === "hotp" ? parseInt(form.counter) || 0 : undefined,
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <X color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {isEditing ? TEXTS.editAccount : TEXTS.newAccount}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Check color={form.color} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <CustomInput
          label={TEXTS.accNameLabel}
          value={form.name}
          onChangeText={(t: string) => updateForm("name", t)}
          placeholder={TEXTS.accNamePlace}
          fieldKey="name"
          colors={colors}
          focusedInput={focusedInput}
          setFocusedInput={setFocusedInput}
          activeColor={form.color}
        />

        <CustomInput
          label={TEXTS.issuerLabel}
          value={form.issuer}
          onChangeText={(t: string) => updateForm("issuer", t)}
          placeholder={TEXTS.issuerPlace}
          fieldKey="issuer"
          colors={colors}
          focusedInput={focusedInput}
          setFocusedInput={setFocusedInput}
          activeColor={form.color}
        />

        <CustomInput
          label={TEXTS.secretLabel}
          value={form.secret}
          onChangeText={(t: string) => updateForm("secret", t.toUpperCase())}
          placeholder={TEXTS.secretPlace}
          fieldKey="secret"
          colors={colors}
          focusedInput={focusedInput}
          setFocusedInput={setFocusedInput}
          activeColor={form.color}
          isPassword={true}
          isPasswordVisible={isSecretVisible}
          onTogglePasswordVisibility={() => setIsSecretVisible(!isSecretVisible)}
        />

          {folders.length > 0 && (
          <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.folder}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                <FolderChip label={TEXTS.none} selected={!form.folderId} onPress={() => updateForm('folderId', undefined)} color={form.color} colors={colors} />
                {folders.map(f => (
                  <FolderChip key={f.id} label={f.name} selected={form.folderId === f.id} onPress={() => updateForm('folderId', f.id)} color={form.color} colors={colors} icon />
                ))}
              </ScrollView>
            </View>
          )}

        <View style={{ marginBottom: 10 }}>
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.iconLabel}</Text>
          <IconPicker
            selectedColor={form.color}
            selectedIcon={form.icon}
            onSelect={(icon) => updateForm("icon", icon)}
            colors={colors}
          />
        </View>

        <View style={{ marginBottom: 10 }}>
          <Text style={[styles.label, { color: colors.subtext }]}>{TEXTS.colorLabel}</Text>
          <ColorPicker
            selectedColor={form.color}
            onSelect={(color) => updateForm("color", color)}
            colors={colors}
          />
        </View>


        {/* Advanced Options Button */}
        <TouchableOpacity
          style={[styles.advancedButton, { backgroundColor: colors.modalBg }]}
          onPress={toggleAdvanced}
          activeOpacity={0.7}
        >
          <Text style={[styles.advancedButtonText, { color: colors.text }]}>Opciones Avanzadas</Text>
          {showAdvanced ? <ChevronUp size={20} color={colors.subtext} /> : <ChevronDown size={20} color={colors.subtext} />}
        </TouchableOpacity>

        {/* Advanced Options */}
        {showAdvanced && (
          <View style={[
            styles.advancedContainer,
            {
              backgroundColor: form.color + "10",
              borderColor: form.color + "60"
            }
          ]}>

            <SelectionGroup label="Tipo de Token" options={["totp", "hotp"]} fieldKey="type" form={form} updateForm={updateForm} colors={colors} />
            <SelectionGroup label="Algoritmo" options={["SHA1", "SHA256", "SHA512"]} fieldKey="algorithm" form={form} updateForm={updateForm} colors={colors} />
            <SelectionGroup label="Dígitos" options={[5, 6, 7, 8]} fieldKey="digits" form={form} updateForm={updateForm} colors={colors} />

            <View style={styles.row}>
              {form.type === "totp" ? (
                <View style={{ flex: 1 }}>
                  <CustomInput
                    label="Periodo (segundos)"
                    value={form.period}
                    onChangeText={(t: string) => updateForm("period", t)}
                    placeholder="30"
                    fieldKey="period"
                    keyboardType="numeric"
                    colors={colors}
                    focusedInput={focusedInput}
                    setFocusedInput={setFocusedInput}
                    activeColor={form.color}
                  />
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <CustomInput
                    label="Contador Inicial"
                    value={form.counter}
                    onChangeText={(t: string) => updateForm("counter", t)}
                    placeholder="0"
                    fieldKey="counter"
                    keyboardType="numeric"
                    colors={colors}
                    focusedInput={focusedInput}
                    setFocusedInput={setFocusedInput}
                    activeColor={form.color}
                  />
                </View>
              )}
            </View>

          </View>
        )}

        <View style={{ height: 10 }} />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: form.color }]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Save color="white" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>{loading
            ? TEXTS.saving
            : (isEditing ? TEXTS.confirmEdit : TEXTS.save)
          }</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />
      </ScrollView>
    </View>
  );
}

const FolderChip = ({ label, selected, onPress, color, colors, icon }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.chip, { backgroundColor: selected ? color : colors.card, borderColor: selected ? color : colors.headerBorder }]}>
    {icon && <FolderOpen size={16} color={selected ? 'white' : colors.text} style={{ marginRight: 6 }} />}
    <Text style={{ color: selected ? 'white' : colors.text, fontWeight: '600' }}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerButton: { padding: 5 },
  title: { fontSize: 20, fontWeight: "bold" },
  content: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, marginBottom: 8, fontWeight: "600", marginLeft: 2 },
  input: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center"
  },
  advancedButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
  },
  advancedButtonText: { fontWeight: "600", fontSize: 15 },
  advancedContainer: {
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  selectionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  selectionBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 5,
  },
  row: { flexDirection: "row", gap: 15 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
});