import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, useColorScheme, StatusBar, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Plus, QrCode, Keyboard, Trash2, ArrowLeft, X, FolderOpen, Folder as FolderIcon, ArrowRight, Home } from 'lucide-react-native';
import { TotpCard } from '../../components/TotpCard';
import { loadAuthData, saveAuthData } from '../../storage/secureStore';
import { Account, Folder } from '../../types';
import { TEXTS } from '../../constants/Languages';
import { getColors } from '../../constants/Styles';
import { DeleteModal } from '@/components/DeleteModal';

export default function FolderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

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

    setAllFolders(data.folders || []);
    const currentFolder = data.folders?.find(f => f.id === id);
    setFolder(currentFolder || null);
    const folderAccounts = data.accounts.filter(acc => acc.folderId === id);
    setAccounts(folderAccounts);

    setLoading(false);
  };

  // --- SELECTION MANAGEMENT ---
  const handleAccountPress = (account: Account) => {
    if (selectionMode) {
      toggleSelection(account.id);
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

  const exitSelectionMode = () => {
    setSelectedIds([]);
    setMoveModalVisible(false);
    setDeleteModalVisible(false);
  };

  const handleDeleteSelected = () => {
    setDeleteModalVisible(true);
  };

  const performBatchDelete = async () => {
    const data = await loadAuthData();
    data.accounts = data.accounts.filter(acc => !selectedIds.includes(acc.id));

    await saveAuthData(data);
    loadData();
    exitSelectionMode();
  };

  // --- MOVE ---
  const handleMoveSelected = () => {
    setMoveModalVisible(true);
  };

  const performBatchMove = async (targetFolderId: string | undefined) => {
    const data = await loadAuthData();

    data.accounts = data.accounts.map(acc => {
      if (selectedIds.includes(acc.id)) {
        return { ...acc, folderId: targetFolderId };
      }
      return acc;
    });

    await saveAuthData(data);
    loadData();
    exitSelectionMode();
  };

  // --- HEADER ---
  const renderHeader = () => {
    if (selectionMode) {
      return (
        <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
          <TouchableOpacity onPress={exitSelectionMode} style={{ padding: 8 }}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: 20, color: colors.text }]}>
            {selectedIds.length} {TEXTS.selected}
          </Text>
          <View style={{ flexDirection: 'row', gap: 25 }}>
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
      <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 5 }}>
            <ArrowLeft color={colors.text} size={26} />
          </TouchableOpacity>

          <Text
            style={[styles.title, { color: colors.text, fontSize: 22 }]}
            numberOfLines={1}
          >
            {folder ? folder.name : 'Carpeta'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>
    );
  };

  const handleManualEntry = () => {
    setAddModalVisible(false);
    router.push({ pathname: '/add-account', params: { initialFolderId: id } });
  };

  const availableFolders = allFolders.filter(f => f.id !== id);

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
            onPress={() => handleAccountPress(item)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text }]}>{TEXTS.empty}</Text>
              <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
                {TEXTS.emptyFolder}
              </Text>
            </View>
          ) : null
        }
      />

      {/* MODAL 1: ADD ACCOUNT */}
      {!selectionMode && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={addModalVisible}
          onRequestClose={() => setAddModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setAddModalVisible(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{TEXTS.addAccount}</Text>

              <TouchableOpacity style={styles.modalOption} onPress={() => {
                setAddModalVisible(false);
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

              <TouchableOpacity style={[styles.cancelButton]} onPress={() => setAddModalVisible(false)}>
                <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 16 }}>{TEXTS.cancel}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* MODAL 2: MOVE ACCOUNTS */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={moveModalVisible}
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMoveModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg, maxHeight: '60%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{TEXTS.moveAccounts}</Text>

            <ScrollView>
              <TouchableOpacity
                style={[styles.folderItem, { borderBottomColor: colors.headerBorder }]}
                onPress={() => performBatchMove(undefined)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Home size={20} color={colors.text} style={{ marginRight: 12 }} />
                  <Text style={[styles.optionText, { color: colors.text, fontSize: 16 }]}>{TEXTS.principalFolder}</Text>
                </View>
                <ArrowRight size={18} color={colors.subtext} />
              </TouchableOpacity>

              {availableFolders.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.folderItem, { borderBottomColor: colors.headerBorder }]}
                  onPress={() => performBatchMove(f.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FolderIcon size={20} color={f.color || colors.text} style={{ marginRight: 12 }} />
                    <Text style={[styles.optionText, { color: colors.text, fontSize: 16 }]}>{f.name}</Text>
                  </View>
                  <ArrowRight size={18} color={colors.subtext} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.cancelButton, { marginTop: 10 }]} onPress={() => setMoveModalVisible(false)}>
              <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 16 }}>{TEXTS.cancel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 3: DELETE ACCOUNTS */}
      <DeleteModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={performBatchDelete}
        count={selectedIds.length}
        colors={colors}
      />

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
  cancelButton: { marginTop: 20, padding: 15, borderRadius: 12, alignItems: 'center', backgroundColor: "#202122" },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1
  }
});