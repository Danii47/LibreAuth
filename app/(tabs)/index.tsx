import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Modal, useColorScheme, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Plus, QrCode, Keyboard, Trash2, FolderOpen, X, FolderPlus } from 'lucide-react-native';
import { TotpCard } from '../../components/TotpCard';
import { FolderCard } from '../../components/FolderCard';
import { loadAuthData, saveAuthData } from '../../storage/secureStore';
import { Account, Folder } from '../../types';
import { TEXTS } from '../../constants/Languages';
import { getColors } from '../../constants/Styles';

// Tipo unión para la lista mezclada
type ListItem = Account | Folder;

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  // Estados separados para carpetas y cuentas
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Selección
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectionMode = selectedIds.length > 0;

  useFocusEffect(
    useCallback(() => {
      loadData();
      setSelectedIds([]);
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    const data = await loadAuthData();
    setAccounts(data.accounts || []);
    setFolders(data.folders || []);
    setLoading(false);
  };

  const isFolder = (item: ListItem): item is Folder => {
    return !('secret' in item);
  };

  const itemsToDisplay: ListItem[] = [
    ...folders,
    ...accounts.filter(acc => !acc.folderId)
  ].sort((a, b) => b.createdAt - a.createdAt);

  // --- GESTIÓN DE CLICK ---
  const handleItemPress = (item: ListItem) => {
    if (selectionMode) {
      toggleSelection(item.id);
    } else {
      if (isFolder(item)) {
        router.push({
          pathname: '/folder/[id]',
          params: { id: item.id }
        });
      }
    }
  };

  const handleLongPress = (item: ListItem) => {
    if (!selectionMode) {
      setSelectedIds([item.id]);
    } else {
      toggleSelection(item.id);
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const exitSelectionMode = () => setSelectedIds([]);

  const handleDeleteSelected = () => {
    Alert.alert(
      TEXTS.delete,
      `${TEXTS.confirmDelete} ${selectedIds.length} ${TEXTS.confirmDelete2}`,
      [
        { text: TEXTS.cancel, style: "cancel" },
        { text: TEXTS.delete, style: "destructive", onPress: performBatchDelete }
      ]
    );
  };

  const performBatchDelete = async () => {
    const data = await loadAuthData();

    const folderIdsToDelete = data.folders
      .filter(folder => selectedIds.includes(folder.id))
      .map(folder => folder.id);

    data.accounts = data.accounts.filter(account => {
      const isExplicitlySelected = selectedIds.includes(account.id);
      const isInDeletedFolder = account.folderId ? folderIdsToDelete.includes(account.folderId) : false;

      return !isExplicitlySelected && !isInDeletedFolder;
    });

    data.folders = data.folders.filter(f => !selectedIds.includes(f.id));

    await saveAuthData(data);

    setAccounts(data.accounts);
    setFolders(data.folders || []);
    exitSelectionMode();
  };

  const handleMoveSelected = () => {
    Alert.alert("Info", "Mover elementos próximamente");
  };

  // --- RENDERIZADO ---
  const renderHeader = () => {
    if (selectionMode) {
      return (
        <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder || '#eee' }]}>
          <TouchableOpacity onPress={exitSelectionMode} style={{ padding: 8 }}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: 20, color: colors.text }]}>
            {selectedIds.length} {TEXTS.selected || 'Seleccionado'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <TouchableOpacity onPress={handleMoveSelected}>
              <FolderOpen color={colors.text} size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteSelected}>
              <Trash2 color={colors.danger} size={24} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder || '#eee' }]}>
        <Text style={[styles.title, { color: colors.text }]}>{TEXTS.myKeys}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {renderHeader()}

      <FlatList
        data={itemsToDisplay}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const isSel = selectedIds.includes(item.id);

          if (isFolder(item)) {
            return (
              <FolderCard
                folder={item}
                selectionMode={selectionMode}
                isSelected={isSel}
                onPress={() => handleItemPress(item)}
                onLongPress={() => handleLongPress(item)}
              />
            );
          }

          return (
            <TotpCard
              account={item}
              selectionMode={selectionMode}
              isSelected={isSel}
              onPress={() => handleItemPress(item)} // OJO: TotpCard espera (account) => void
              onLongPress={() => handleLongPress(item)}
            />
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text }]}>{TEXTS.empty || "No hay nada aquí"}</Text>
              <Text style={[styles.emptySubtext, { color: colors.subtext }]}>{TEXTS.emptySub || "Pulsa + para empezar"}</Text>
            </View>
          ) : null
        }
      />

      {/* MODAL DEL MENÚ + */}
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
            <View style={[styles.modalContent, { backgroundColor: colors.modalBg || 'white' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{TEXTS.addAccount || 'Añadir'}</Text>

              {/* Opción 1: Escanear */}
              <TouchableOpacity style={styles.modalOption} onPress={() => {
                setModalVisible(false);
                router.push('/scan-qr');
              }}>
                <QrCode size={24} color={colors.text} style={{ marginRight: 15 }} />
                <Text style={[styles.optionText, { color: colors.text }]}>{TEXTS.scanQR || 'Escanear QR'}</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: colors.headerBorder || '#eee', marginVertical: 5 }} />

              {/* Opción 2: Manual */}
              <TouchableOpacity style={styles.modalOption} onPress={() => { setModalVisible(false); router.push('/add-account'); }}>
                <Keyboard size={24} color={colors.text} style={{ marginRight: 15 }} />
                <Text style={[styles.optionText, { color: colors.text }]}>{TEXTS.manualEntry || 'Manual'}</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: colors.headerBorder || '#eee', marginVertical: 5 }} />

              {/* Opción 3: NUEVA CARPETA */}
              <TouchableOpacity style={styles.modalOption} onPress={() => { setModalVisible(false); router.push('/add-folder'); }}>
                <FolderPlus size={24} color={colors.text} style={{ marginRight: 15 }} />
                <Text style={[styles.optionText, { color: colors.text }]}>Crear Carpeta</Text>
              </TouchableOpacity>

              {/* Cancelar */}
              <TouchableOpacity style={[styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 16 }}>{TEXTS.cancel || 'Cancelar'}</Text>
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
  title: { fontSize: 28, fontWeight: 'bold' },
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