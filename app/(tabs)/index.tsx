import { StyleSheet, Text, View, FlatList, TouchableOpacity, useColorScheme, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Plus, Trash2, FolderOpen, X } from 'lucide-react-native';
import { TotpCard } from '../../components/TotpCard';
import { FolderCard } from '../../components/FolderCard';
import { loadAuthData, saveAuthData } from '../../storage/secureStore';
import { Account, Folder } from '../../types';
import { TEXTS } from '../../constants/Languages';
import { getColors } from '../../constants/Styles';
import { DeleteModal } from '@/components/DeleteModal';
import { AddOptionsModal } from '@/components/AddOptionsModal';
import { MoveToFolderModal } from '@/components/MoveToFolderModal';

type ListItem = Account | Folder;

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
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

  const hasFolderSelected = selectedIds.some(id => folders.some(folder => folder.id === id));

  const itemsToDisplay: ListItem[] = [
    ...folders,
    ...accounts.filter(acc => !acc.folderId)
  ].sort((a, b) => b.createdAt - a.createdAt);

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
    if (folders.length === 0) {
      alert(TEXTS.noFoldersCreated);
      return;
    }
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
    await loadData();
    exitSelectionMode();
  };

  const handleScanQR = () => {
    setAddModalVisible(false);
    router.push('/scan-qr');
  };
  const handleManualEntry = () => {
    setAddModalVisible(false);
    router.push('/add-account');
  };
  const handleCreateFolder = () => {
    setAddModalVisible(false);
    router.push('/add-folder');
  };

  const renderHeader = () => {
    if (selectionMode) {
      return (
        <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder || '#eee' }]}>
          <TouchableOpacity onPress={exitSelectionMode} style={{ padding: 8 }}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontSize: 20, color: colors.text }]}>
            {selectedIds.length} {TEXTS.selected}
          </Text>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            {!hasFolderSelected && (
              <TouchableOpacity onPress={handleMoveSelected}>
                <FolderOpen color={colors.text} size={24} />
              </TouchableOpacity>
            )}
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
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
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
              onPress={() => handleItemPress(item)}
              onLongPress={() => handleLongPress(item)}
            />
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text }]}>{TEXTS.empty}</Text>
              <Text style={[styles.emptySubtext, { color: colors.subtext }]}>{TEXTS.pressToStart}</Text>
            </View>
          ) : null
        }
      />

      {/* MODAL 1: ADD */}
      <AddOptionsModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onScanQR={handleScanQR}
        onManualEntry={handleManualEntry}
        onCreateFolder={handleCreateFolder}
        showCreateFolder={true} // EN HOME SI MOSTRAMOS CARPETA
        colors={colors}
      />

      {/* MODAL 2: MOVE TO FOLDER */}
      <MoveToFolderModal
        visible={moveModalVisible}
        onClose={() => setMoveModalVisible(false)}
        colors={colors}
        folders={folders}
        onMoveToFolder={performBatchMove}
        count={selectedIds.length}
      />

      {/* MODAL 3: DELETE */}
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
  title: { fontSize: 28, fontWeight: 'bold' },
  addButton: { backgroundColor: '#2e78b7', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.8 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, marginTop: 5 },
});