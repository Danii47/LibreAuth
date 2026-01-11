import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Plus, Trash2, FolderOpen, X, Settings, Pencil, Search, ArrowLeft } from 'lucide-react-native';
import { TEXTS } from '@/constants/Languages';

interface HomeHeaderProps {
  selectionMode: boolean;
  selectedCount: number;
  onExitSelection: () => void;
  onMove: () => void;
  onDelete: () => void;
  onSettings: () => void;
  onAdd: () => void;
  onEdit: () => void;
  onSearch: () => void;

  // Nuevas props para el buscador
  isSearching: boolean;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onCancelSearch: () => void;

  colors: any;
}

export const HomeHeader = ({
  selectionMode,
  selectedCount,
  onExitSelection,
  onMove,
  onDelete,
  onSettings,
  onAdd,
  onEdit,
  onSearch,
  isSearching,
  searchQuery,
  onSearchChange,
  onCancelSearch,
  colors
}: HomeHeaderProps) => {
  return (
    <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.headerBorder || '#eee' }]}>
      {selectionMode ? (
        <View style={styles.selectionRow}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={onExitSelection} style={styles.iconButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>

            <Text style={[styles.title, { fontSize: 20, color: colors.text }]}>
              {selectedCount} {selectedCount === 1 ? TEXTS.selectedOneItem : TEXTS.selectedMoreItems}
            </Text>
          </View>

          <View style={styles.rightActions}>
            {selectedCount === 1 && (
              <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
                <Pencil color={colors.text} size={24} />
              </TouchableOpacity>
            )}

            {selectedCount > 0 && (
              <>
                <TouchableOpacity onPress={onMove} style={styles.iconButton}>
                  <FolderOpen color={colors.text} size={24} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
                  <Trash2 color={colors.danger} size={24} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      ) : isSearching ? (
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={onCancelSearch} style={styles.iconButton}>
            <ArrowLeft color={colors.text} size={26} />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.searchInput,
              {
                color: colors.text,
                backgroundColor: colors.card || '#f2f2f2'
              }
            ]}
            placeholder="Buscar..."
            placeholderTextColor={colors.subtext}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')} style={styles.iconButton}>
              <X color={colors.subtext} size={20} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.normalRow}>
          <Text style={[styles.title, { color: colors.text }]}>{TEXTS.myKeys}</Text>
          <View style={styles.rightActions}>
            <TouchableOpacity onPress={onSettings} style={styles.iconButton}>
              <Settings color={colors.text} size={26} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onSearch} style={styles.iconButton}>
              <Search color={colors.text} size={26} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onAdd} style={styles.addButton}>
              <Plus color="white" size={24} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 110,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  normalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 4,
  },
  addButton: {
    backgroundColor: '#2e78b7',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  }
});