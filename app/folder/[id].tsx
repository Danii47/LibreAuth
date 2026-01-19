import { StyleSheet, View, Text, StatusBar, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TotpCard } from '@/components/TotpCard';
import { loadAuthData, saveAuthData } from '@/storage/secureStore';
import { Account, Folder } from '@/types';
import { TEXTS } from '@/constants/Languages';
import { getColors } from '@/constants/Styles';
import { DeleteModal } from '@/components/DeleteModal';
import { AddOptionsModal } from '@/components/AddOptionsModal';
import { MoveToFolderModal } from '@/components/MoveToFolderModal';
import { HomeHeader } from '@/components/HomeHeader';
import { useSelection } from '@/hooks/useSelection';

export default function FolderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [modals, setModals] = useState({ add: false, move: false, delete: false });

  const { selectedIds, selectionMode, toggleSelection, clearSelection, startSelection } = useSelection();

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await loadAuthData();

    setAllFolders(data.folders || []);
    const currentFolder = data.folders?.find(f => f.id === id);
    setFolder(currentFolder || null);

    const folderAccounts = data.accounts.filter(acc => acc.folderId === id);
    folderAccounts.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    setAccounts(folderAccounts);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      clearSelection();
      setIsSearching(false);
      setSearchQuery('');
    }, [loadData, clearSelection])
  );

  const filteredData = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) {
      return accounts;
    }
    const query = searchQuery.toLowerCase();
    return accounts.filter(acc =>
      acc.name.toLowerCase().includes(query) ||
      acc.issuer?.toLowerCase().includes(query)
    );
  }, [accounts, isSearching, searchQuery]);

  const toggleModal = (key: keyof typeof modals, val: boolean) => setModals(prev => ({ ...prev, [key]: val }));

  const onDragEnd = async ({ data: newData }: { data: Account[] }) => {
    if (isSearching) return;

    const updatedData = newData.map((item, index) => ({
      ...item,
      position: index
    }));

    setAccounts(updatedData);

    const authData = await loadAuthData();
    const allAccounts = authData.accounts || [];

    const updatedGlobalAccounts = allAccounts.map(account => {
      const updated = updatedData.find(u => u.id === account.id);
      return updated ? { ...account, position: updated.position } : account;
    });

    await saveAuthData({ ...authData, accounts: updatedGlobalAccounts });
  };

  const handlePress = useCallback((item: Account) => {
    if (selectionMode) {
      toggleSelection(item.id);
    }
  }, [selectionMode, toggleSelection]);

  const handleLongPress = useCallback((item: Account) => {
    if (isSearching) return;
    if (!selectionMode) startSelection(item.id);
    else toggleSelection(item.id);
  }, [selectionMode, startSelection, toggleSelection, isSearching]);

  const performBatchDelete = async () => {
    const data = await loadAuthData();
    data.accounts = data.accounts.filter(acc => !selectedIds.includes(acc.id));
    await saveAuthData(data);
    loadData();
    clearSelection();
    toggleModal('delete', false);
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
    clearSelection();
    toggleModal('move', false);
  };

  const handleEdit = () => {
    const accountId = selectedIds[0];
    const account = accounts.find(a => a.id === accountId);

    if (!account) return;

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
    clearSelection();
  };

  const handleScanQR = () => {
    toggleModal('add', false);
    router.push({
      pathname: '/scan-qr',
      params: { initialFolderId: id }
    });
  };

  const handleManualEntry = () => {
    toggleModal('add', false);
    router.push({ pathname: '/add-account', params: { initialFolderId: id } });
  };

  const availableFolders = allFolders.filter(f => f.id !== id);

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<Account>) => {
    const isSel = selectedIds.includes(item.id);
    const dragEnabled = !isSearching;

    return (
      <ScaleDecorator activeScale={1.03}>
        <TotpCard
          account={item}
          selectionMode={selectionMode}
          isSelected={isSel}
          drag={dragEnabled ? drag : undefined}
          isActive={isActive}
          onPress={() => handlePress(item)}
          onLongPress={() => handleLongPress(item)}
        />
      </ScaleDecorator>
    );
  }, [selectionMode, selectedIds, handlePress, handleLongPress, isSearching]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

        <HomeHeader
          selectionMode={selectionMode}
          selectedCount={selectedIds.length}
          onExitSelection={clearSelection}

          onMove={() => toggleModal('move', true)}
          onDelete={() => toggleModal('delete', true)}
          onEdit={handleEdit}

          onSettings={() => router.push('/settings')}
          onAdd={() => toggleModal('add', true)}

          onSearch={() => setIsSearching(true)}
          isSearching={isSearching}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCancelSearch={() => {
            setIsSearching(false);
            setSearchQuery('');
          }}

          title={folder ? folder.name : 'Carpeta'}
          onBack={() => router.back()}

          colors={colors}
        />

        <DraggableFlatList
          data={filteredData}
          onDragEnd={onDragEnd}
          keyExtractor={(item) => item.id}
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
                  {isSearching ? TEXTS.tryAnotherSearch : TEXTS.emptyFolder}
                </Text>
              </View>
            ) : null
          }
        />

        <AddOptionsModal
          visible={modals.add}
          onClose={() => toggleModal('add', false)}
          onScanQR={handleScanQR}
          onManualEntry={handleManualEntry}
          colors={colors}
          showCreateFolder={false}
        />

        <MoveToFolderModal
          visible={modals.move}
          onClose={() => toggleModal('move', false)}
          colors={colors}
          folders={availableFolders}
          onMoveToFolder={performBatchMove}
          count={selectedIds.length}
        />

        <DeleteModal
          visible={modals.delete}
          onClose={() => toggleModal('delete', false)}
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
  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.8 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, marginTop: 5 },
});