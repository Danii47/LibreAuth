import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Folder as FolderIcon, Home, ArrowRight } from 'lucide-react-native';
import { Folder } from '../types';
import { TEXTS } from '../constants/Languages';

interface MoveToFolderModalProps {
  visible: boolean;
  onClose: () => void;
  colors: any;
  folders: Folder[];
  onMoveToFolder: (folderId: string | undefined) => void;
  count: number;
}

export const MoveToFolderModal = ({
  visible,
  onClose,
  colors,
  folders,
  onMoveToFolder,
  count
}: MoveToFolderModalProps) => {

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.modalBg || 'white' }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {TEXTS.moveAccounts || 'Mover a carpeta'}
          </Text>

          <Text style={{ color: colors.subtext, textAlign: 'center', marginBottom: 15 }}>
            Selecciona el destino para {count} cuenta(s)
          </Text>

          <ScrollView style={{ maxHeight: 300 }}>
            {/* OPTION 1: Root folder */}
            <TouchableOpacity
              style={[styles.folderItem, { borderBottomColor: colors.headerBorder || '#eee' }]}
              onPress={() => onMoveToFolder(undefined)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Home size={20} color={colors.text} style={{ marginRight: 12 }} />
                <Text style={[styles.optionText, { color: colors.text, fontSize: 16 }]}>
                  {TEXTS.principalFolder || "Principal (Sin carpeta)"}
                </Text>
              </View>
              <ArrowRight size={18} color={colors.subtext} />
            </TouchableOpacity>

            {/* OPTION 2: Other folders */}
            {folders.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                style={[styles.folderItem, { borderBottomColor: colors.headerBorder || '#eee' }]}
                onPress={() => onMoveToFolder(folder.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FolderIcon size={20} color={folder.color || colors.text} style={{ marginRight: 12 }} />
                  <Text style={[styles.optionText, { color: colors.text, fontSize: 16 }]}>
                    {folder.name}
                  </Text>
                </View>
                <ArrowRight size={18} color={colors.subtext} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={[styles.cancelButton]} onPress={onClose}>
            <Text style={{ color: colors.danger || '#ef4444', fontWeight: 'bold', fontSize: 16 }}>
              {TEXTS.cancel || 'Cancelar'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  optionText: {
    fontSize: 18
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: "#202122"
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1
  }
});