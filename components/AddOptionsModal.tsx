import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { QrCode, Keyboard, FolderPlus } from 'lucide-react-native';
import { TEXTS } from '../constants/Languages';

interface AddOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  colors: any;

  // Actions
  onScanQR: () => void;
  onManualEntry: () => void;
  onCreateFolder?: () => void;
  
  // Visibility Options
  showScanQR?: boolean;
  showManualEntry?: boolean;
  showCreateFolder?: boolean;
}

export const AddOptionsModal = ({
  visible,
  onClose,
  colors,
  onScanQR,
  onManualEntry,
  onCreateFolder,
  showScanQR = true,
  showManualEntry = true,
  showCreateFolder = false,
}: AddOptionsModalProps) => {
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
            {TEXTS.addAccount || 'Añadir'}
          </Text>

          {/* OPTION 1: Scan QR */}
          {showScanQR && (
            <TouchableOpacity style={styles.modalOption} onPress={onScanQR}>
              <QrCode size={24} color={colors.text} style={{ marginRight: 15 }} />
              <Text style={[styles.optionText, { color: colors.text }]}>
                {TEXTS.scanQR || 'Escanear QR'}
              </Text>
            </TouchableOpacity>
          )}

          {/* SEPARATOR 1 */}
          {showScanQR && showManualEntry && (
            <View style={{ height: 1, backgroundColor: colors.headerBorder || '#eee', marginVertical: 5 }} />
          )}

          {/* OPTION 2: Manual */}
          {showManualEntry && (
            <TouchableOpacity style={styles.modalOption} onPress={onManualEntry}>
              <Keyboard size={24} color={colors.text} style={{ marginRight: 15 }} />
              <Text style={[styles.optionText, { color: colors.text }]}>
                {TEXTS.manualEntry || 'Manual'}
              </Text>
            </TouchableOpacity>
          )}

          {/* SEPARATOR 2 */}
          {(showScanQR || showManualEntry) && showCreateFolder && (
            <View style={{ height: 1, backgroundColor: colors.headerBorder || '#eee', marginVertical: 5 }} />
          )}

          {/* OPTION 3: Create Folder */}
          {showCreateFolder && onCreateFolder && (
            <TouchableOpacity style={styles.modalOption} onPress={onCreateFolder}>
              <FolderPlus size={24} color={colors.text} style={{ marginRight: 15 }} />
              <Text style={[styles.optionText, { color: colors.text }]}>
                {TEXTS.createFolder}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.cancelButton]} onPress={onClose}>
            <Text style={{ color: colors.danger || '#ef4444', fontWeight: 'bold', fontSize: 16 }}>
              {TEXTS.cancel}
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
    paddingBottom: 40
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16
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
  }
});