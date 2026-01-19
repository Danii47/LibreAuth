import { StyleSheet, View, Text, StatusBar, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TotpCard } from '@/components/TotpCard';
import { FolderCard } from '@/components/FolderCard';
import { DeleteModal } from '@/components/DeleteModal';
import { AddOptionsModal } from '@/components/AddOptionsModal';
import { MoveToFolderModal } from '@/components/MoveToFolderModal';
import { HomeHeader } from '@/components/HomeHeader';

import { useSelection } from '@/hooks/useSelection';
import { getColors } from '@/constants/Styles';
import { Account, Folder } from '@/types';
import { TEXTS } from '@/constants/Languages';
import { loadAuthData, saveAuthData } from '@/storage/secureStore';
import { isFolder } from '@/utils';

type ListItem = Account | Folder;

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [data, setData] = useState<ListItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const [modals, setModals] = useState({ add: false, move: false, delete: false });

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { selectedIds, selectionMode, toggleSelection, clearSelection, startSelection } = useSelection();

  const loadData = useCallback(async () => {
    setLoading(true);
    const authData = await loadAuthData();

    const loadedAccounts = authData.accounts || [];
    const loadedFolders = authData.folders || [];

    setFolders(loadedFolders);

    // Only get root accounts (no folder)
    const rootAccounts = loadedAccounts.filter(acc => !acc.folderId);

    const mergedList: ListItem[] = [...loadedFolders, ...rootAccounts];

    mergedList.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    setData(mergedList);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      clearSelection();
    }, [loadData, clearSelection])
  );

  const filteredData = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();

    return data.filter((item: Account | Folder) => {
      if (isFolder(item)) {
        return item.name.toLowerCase().includes(query);
      } else {
        const nameMatch = (item as Account).name.toLowerCase().includes(query);
        const issuerMatch = (item as Account).issuer?.toLowerCase().includes(query);
        return nameMatch || issuerMatch;
      }
    });
  }, [data, isSearching, searchQuery]);

  const toggleModal = (key: keyof typeof modals, val: boolean) => setModals(prev => ({ ...prev, [key]: val }));

  const onDragEnd = async ({ data: newData }: { data: ListItem[] }) => {
    if (isSearching) return;

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
      return updatedFolder ? { ...folder, position: updatedFolder.position } : folder;
    });

    const updatedAccounts = allAccounts.map(account => {
      const updatedAccount = updatedData.find(item => item.id === account.id) as Account | undefined;
      return updatedAccount ? { ...account, position: updatedAccount.position } : account;
    });

    await saveAuthData({ folders: updatedFolders, accounts: updatedAccounts });
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) return;

    const itemId = selectedIds[0];
    const item = data.find(item => item.id === itemId);

    if (!item) return;

    if (isFolder(item)) {
      router.push({
        pathname: '/add-folder',
        params: {
          id: item.id,
          name: item.name,
          icon: item.icon,
          color: item.color
        }
      });
    } else {
      const account = item as Account;
      router.push({
        pathname: '/add-account',
        params: {
          id: account.id,
          name: account.name,
          issuer: account.issuer,
          secret: account.secret,
          icon: account.icon,
          color: account.color,
          type: account.type,
          algorithm: account.algorithm,
          digits: account.digits?.toString(),
          period: account.period?.toString(),
          counter: account.counter?.toString(),

          folderId: account.folderId
        }
      });
    }
    clearSelection();
  };

  const handlePress = useCallback((item: ListItem) => {
    if (selectionMode) {
      toggleSelection(item.id);
    } else if (isFolder(item)) {
      router.push({ pathname: '/folder/[id]', params: { id: item.id } });
    }
  }, [selectionMode, router, toggleSelection]);

  const handleLongPress = useCallback((item: ListItem) => {
    if (isSearching) return;

    if (!selectionMode) startSelection(item.id);
    else toggleSelection(item.id);
  }, [selectionMode, startSelection, toggleSelection, isSearching]);

  const handleBatchDelete = async () => {
    const data = await loadAuthData();

    data.folders = data.folders.filter(f => !selectedIds.includes(f.id));

    const deletedFolders = folders.filter(f => selectedIds.includes(f.id)).map(f => f.id);

    data.accounts = data.accounts.filter(a => !selectedIds.includes(a.id) && (!a.folderId || !deletedFolders.includes(a.folderId)));

    await saveAuthData(data);

    loadData();
    clearSelection();
    toggleModal('delete', false);
  };

  const handleBatchMove = async (targetId: string | undefined) => {
    const data = await loadAuthData();
    data.accounts = data.accounts.map(account => selectedIds.includes(account.id) ? { ...account, folderId: targetId } : account);
    await saveAuthData(data);
    loadData();
    clearSelection();
    toggleModal('move', false);
  };

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    const isSel = selectedIds.includes(item.id);

    const dragEnabled = !isSearching;

    const props = {
      selectionMode,
      isSelected: isSel,
      drag: dragEnabled ? drag : undefined,
      isActive,
      onPress: () => handlePress(item),
      onLongPress: () => handleLongPress(item)
    };

    return (
      <ScaleDecorator activeScale={1.03}>
        {isFolder(item) ? <FolderCard folder={item} {...props} /> : <TotpCard account={item} {...props} />}
      </ScaleDecorator>
    );
  }, [selectionMode, selectedIds, handlePress, handleLongPress, isSearching]);

  return (
    <GestureHandlerRootView style={{ flex: 1, paddingBottom: 20 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

        <HomeHeader
          selectionMode={selectionMode}
          selectedCount={selectedIds.length}
          onExitSelection={clearSelection}
          onMove={() => toggleModal('move', true)}
          onDelete={() => toggleModal('delete', true)}
          onSettings={() => router.push('/settings')}
          onAdd={() => toggleModal('add', true)}
          onEdit={handleEdit}

          onSearch={() => setIsSearching(true)}
          isSearching={isSearching}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCancelSearch={() => {
            setIsSearching(false);
            setSearchQuery('');
          }}

          colors={colors}
        />

        <DraggableFlatList
          data={filteredData}
          onDragEnd={onDragEnd}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          activationDistance={20}
          dragItemOverflow={true}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  {isSearching ? TEXTS.noResults : TEXTS.empty}
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
                  {isSearching ? TEXTS.tryAnotherSearch : TEXTS.pressToStart}
                </Text>
              </View>
            ) : null
          }
        />

        <AddOptionsModal visible={modals.add} onClose={() => toggleModal('add', false)} colors={colors}
          onScanQR={() => { toggleModal('add', false); router.push('/scan-qr'); }}
          onManualEntry={() => { toggleModal('add', false); router.push('/add-account'); }}
          onCreateFolder={() => { toggleModal('add', false); router.push('/add-folder'); }}
          showCreateFolder
        />
        <MoveToFolderModal visible={modals.move} onClose={() => toggleModal('move', false)} colors={colors} folders={folders} count={selectedIds.length} onMoveToFolder={handleBatchMove} />
        <DeleteModal visible={modals.delete} onClose={() => toggleModal('delete', false)} colors={colors} count={selectedIds.length} onConfirm={handleBatchDelete} />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.8 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, marginTop: 5 },
});