import { StyleSheet, Text, View, TouchableOpacity, useColorScheme, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Plus, Trash2, FolderOpen, X, Settings } from 'lucide-react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

  const [data, setData] = useState<ListItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectionMode = selectedIds.length > 0;

  const loadData = useCallback(async () => {
    setLoading(true);
    const authData = await loadAuthData();

    const loadedAccounts = authData.accounts || [];
    const loadedFolders = authData.folders || [];

    setFolders(loadedFolders);

    const rootAccounts = loadedAccounts.filter(acc => !acc.folderId);

    const mergedList: ListItem[] = [...loadedFolders, ...rootAccounts];

    mergedList.sort((a, b) => a.position - b.position);

    console.log('Data loaded:');

    setData(mergedList);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      console.log('HomeScreen focused, data reloaded');
      setSelectedIds([]);
    }, [loadData])
  );

  const isFolder = useCallback((item: ListItem): item is Folder => {
    return !('secret' in item);
  }, []);

  const onDragEnd = async ({ data: newData }: { data: ListItem[] }) => {
    const updatedData = newData.map((item, index) => ({
      ...item,
      position: index
    }));

    setData(updatedData);

    const currentAuthData = await loadAuthData();
    const allAccounts = currentAuthData.accounts || [];
    const allFolders = currentAuthData.folders || [];

    const updatedFolders = allFolders.map(folder => {
      const updatedFolder = updatedData.find(item => item.id === folder.id) as Folder | undefined;
      if (updatedFolder) {
        return { ...folder, position: updatedFolder.position };
      }
      return folder;
    });

    const updatedAccounts = allAccounts.map(account => {
      const updatedAccount = updatedData.find(item => item.id === account.id) as Account | undefined;
      if (updatedAccount) {
        return { ...account, position: updatedAccount.position };
      }
      return account;
    });

    await saveAuthData({
      folders: updatedFolders,
      accounts: updatedAccounts
    });
  };


  const handleItemPress = useCallback((item: ListItem) => {
    // Usamos el callback del estado para obtener el valor más reciente de selectedIds
    // esto evita problemas de 'closures' antiguas
    setSelectedIds(currentSelection => {
      const isSelecting = currentSelection.length > 0;

      if (isSelecting) {
        // Lógica de toggleSelection integrada aquí para tener acceso a currentSelection fresco
        if (currentSelection.includes(item.id)) {
          return currentSelection.filter(id => id !== item.id);
        } else {
          return [...currentSelection, item.id];
        }
      } else {
        // Navegación (no es selección)
        if (isFolder(item)) {
          router.push({
            pathname: '/folder/[id]',
            params: { id: item.id }
          });
        }
        return currentSelection; // No cambiamos selección
      }
    });
  }, [isFolder, router]);

  const handleLongPress = useCallback((item: ListItem) => {
    setSelectedIds(currentSelection => {
      if (currentSelection.length === 0) {
        return [item.id];
      } else {
        if (currentSelection.includes(item.id)) return currentSelection.filter(id => id !== item.id);
        return [...currentSelection, item.id];
      }
    });
  }, []);

  const exitSelectionMode = () => {
    setSelectedIds([]);
    setMoveModalVisible(false);
    setDeleteModalVisible(false);
  };

  const handleDeleteSelected = () => { setDeleteModalVisible(true); };

  const performBatchDelete = async () => {
    const authData = await loadAuthData();
    const folderIdsToDelete = authData.folders
      .filter(folder => selectedIds.includes(folder.id))
      .map(folder => folder.id);

    authData.accounts = authData.accounts.filter(account => {
      const isExplicitlySelected = selectedIds.includes(account.id);
      const isInDeletedFolder = account.folderId ? folderIdsToDelete.includes(account.folderId) : false;
      return !isExplicitlySelected && !isInDeletedFolder;
    });

    authData.folders = authData.folders.filter(f => !selectedIds.includes(f.id));

    await saveAuthData(authData);
    await loadData();
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
    const authData = await loadAuthData();
    authData.accounts = authData.accounts.map(acc => {
      if (selectedIds.includes(acc.id)) {
        return { ...acc, folderId: targetFolderId };
      }
      return acc;
    });
    await saveAuthData(authData);
    await loadData();
    exitSelectionMode();
  };

  const handleScanQR = () => { setAddModalVisible(false); router.push('/scan-qr'); };
  const handleManualEntry = () => { setAddModalVisible(false); router.push('/add-account'); };
  const handleCreateFolder = () => { setAddModalVisible(false); router.push('/add-folder'); };

  // --- MEMOIZACIÓN PARA EVITAR GHOSTING ---
  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  const hasFolderSelected = selectedIds.some(id => folders.some(folder => folder.id === id));

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    const isSel = selectedIds.includes(item.id);

    if (isFolder(item)) {
      return (
        <ScaleDecorator activeScale={1.03}>
          <FolderCard
            folder={item}
            selectionMode={selectionMode}
            isSelected={isSel}
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleLongPress(item)}
            drag={drag}
            isActive={isActive}
          />
        </ScaleDecorator>
      );
    }

    return (
      <ScaleDecorator activeScale={1.03}>
        <TotpCard
          account={item}
          selectionMode={selectionMode}
          isSelected={isSel}
          onPress={() => handleItemPress(item)}
          onLongPress={() => handleLongPress(item)}
          drag={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    );
  }, [selectionMode, selectedIds, handleItemPress, handleLongPress, isFolder]);

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Settings color={colors.text} size={26} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
            <Plus color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

        {renderHeader()}

        <DraggableFlatList
          data={data}
          onDragEnd={onDragEnd}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          activationDistance={20}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.text }]}>{TEXTS.empty}</Text>
                <Text style={[styles.emptySubtext, { color: colors.subtext }]}>{TEXTS.pressToStart}</Text>
              </View>
            ) : null
          }
        />

        <AddOptionsModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          onScanQR={handleScanQR}
          onManualEntry={handleManualEntry}
          onCreateFolder={handleCreateFolder}
          showCreateFolder={true}
          colors={colors}
        />

        <MoveToFolderModal
          visible={moveModalVisible}
          onClose={() => setMoveModalVisible(false)}
          colors={colors}
          folders={folders}
          onMoveToFolder={performBatchMove}
          count={selectedIds.length}
        />

        <DeleteModal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={performBatchDelete}
          count={selectedIds.length}
          colors={colors}
        />

      </View>
    </GestureHandlerRootView>
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