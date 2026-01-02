import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Modal, useColorScheme, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { useState, useCallback } from 'react';
import { Plus, QrCode, Keyboard, Trash2, ArrowLeft, X } from 'lucide-react-native';
import { TotpCard } from '../../components/TotpCard';
import { loadAuthData, saveAuthData } from '../../storage/secureStore';
import { Account, Folder } from '../../types';
import { TEXTS } from '../../constants/Languages';
import { getColors } from '../../constants/Styles';

export default function FolderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Capturamos el ID de la carpeta (ej: "1709823...")
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Selección
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectionMode = selectedIds.length > 0;

  useFocusEffect(
    useCallback(() => {
      loadData();
      setSelectedIds([]);
    }, [id])
  );

  const loadData = async () => {
    setLoading(true);
    const data = await loadAuthData();

    // 1. Buscamos la info de la carpeta actual (para el título y color)
    const currentFolder = data.folders?.find(f => f.id === id);
    setFolder(currentFolder || null);

    // 2. Filtramos cuentas que pertenezcan a esta carpeta
    const folderAccounts = data.accounts.filter(acc => acc.folderId === id);
    setAccounts(folderAccounts);

    setLoading(false);
  };

  // --- GESTIÓN DE SELECCIÓN ---
  const handleAccountPress = (account: Account) => {
    if (selectionMode) {
      toggleSelection(account.id);
    } else {
      // Ya hace copy dentro de la card
    }
  };

  const handleLongPress = (account: Account) => {
    if (!selectionMode) {
      setSelectedIds([account.id]);
    } else {
      toggleSelection(account.id);
    }
  };

  const toggleSelection = (itemId: string) => {
    if (selectedIds.includes(itemId)) {
      setSelectedIds(selectedIds.filter(i => i !== itemId));
    } else {
      setSelectedIds([...selectedIds, itemId]);
    }
  };

  const exitSelectionMode = () => setSelectedIds([]);

  // --- BORRADO EN CARPETA ---
  const handleDeleteSelected = () => {
    Alert.alert(
      TEXTS.delete || "Eliminar",
      `¿Eliminar ${selectedIds.length} cuentas de esta carpeta?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: performBatchDelete }
      ]
    );
  };

  const performBatchDelete = async () => {
    const data = await loadAuthData();
    // Solo borramos cuentas, no carpetas (porque estamos DENTRO de una)
    data.accounts = data.accounts.filter(acc => !selectedIds.includes(acc.id));

    await saveAuthData(data);

    // Recargamos datos locales
    const updatedFolderAccounts = data.accounts.filter(acc => acc.folderId === id);
    setAccounts(updatedFolderAccounts);
    exitSelectionMode();
  };

  // --- HEADER ---
  const renderHeader = () => {
    // HEADER MODO SELECCIÓN
    if (selectionMode) {
      return (
        <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
          <TouchableOpacity onPress={exitSelectionMode} style={{ padding: 8 }}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: 20, color: colors.text }]}>
            {selectedIds.length} {TEXTS.selected}
          </Text>
          <TouchableOpacity onPress={handleDeleteSelected}>
            <Trash2 color={colors.danger} size={24} />
          </TouchableOpacity>
        </View>
      );
    }

    // HEADER NORMAL DE CARPETA
    return (
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Botón Volver */}
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
            <ArrowLeft color={colors.text} size={26} />
          </TouchableOpacity>

          {/* Título Carpeta (con su icono si quieres, opcional) */}
          <Text
            style={[styles.title, { color: colors.text, fontSize: 22 }]}
            numberOfLines={1}
          >
            {folder ? folder.name : 'Carpeta'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>
    );
  };

  // --- NAVEGACIÓN A AÑADIR (Pre-seleccionando carpeta) ---
  const handleManualEntry = () => {
    setModalVisible(false);
    // Pasamos el folderId por query params para que add-account lo lea (implica pequeño cambio en add-account)
    // O simplemente navegamos normal y el usuario elige. 
    // Para hacerlo PRO, deberíamos pasar: router.push(`/add-account?initialFolderId=${id}`);
    router.push({ pathname: '/add-account', params: { initialFolderId: id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {renderHeader()}

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TotpCard
            account={item}
            selectionMode={selectionMode}
            isSelected={selectedIds.includes(item.id)}
            onPress={() => handleAccountPress(item)} // Solo pasamos la cuenta
            onLongPress={() => handleLongPress(item)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text }]}>{TEXTS.empty}</Text>
              <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
                Esta carpeta está vacía.
              </Text>
            </View>
          ) : null
        }
      />

      {!selectionMode && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{TEXTS.addAccount}</Text>

              <TouchableOpacity style={styles.modalOption} onPress={() => {
                setModalVisible(false);
                router.push('/scan-qr');
              }}>
                <QrCode size={24} color={colors.text} style={{ marginRight: 15 }} />
                <Text style={[styles.optionText, { color: colors.text }]}>{TEXTS.scanQR}</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: colors.headerBorder, marginVertical: 5 }} />

              <TouchableOpacity style={styles.modalOption} onPress={handleManualEntry}>
                <Keyboard size={24} color={colors.text} style={{ marginRight: 15 }} />
                <Text style={[styles.optionText, { color: colors.text }]}>{TEXTS.manualEntry}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 16 }}>{TEXTS.cancel}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, paddingTop: 60, borderBottomWidth: 1 },
  title: { fontSize: 28, fontWeight: 'bold', flexShrink: 1 },
  addButton: { backgroundColor: '#2e78b7', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.8 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  optionText: { fontSize: 18 },
  cancelButton: { marginTop: 20, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: "#202122" }
});