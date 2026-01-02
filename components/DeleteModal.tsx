import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { TEXTS } from '../constants/Languages'; // Asegúrate que la ruta sea correcta

interface DeleteModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  colors: any;
}

export const DeleteModal = ({
  visible,
  onClose,
  onConfirm,
  count,
  colors,
}: DeleteModalProps) => {
  const title = TEXTS.deleteItems;

  const description = (
    <Text style={[styles.modalDescription, { color: colors.subtext }]}>
      {TEXTS.confirmDelete} <Text style={{ fontWeight: 'bold', color: colors.text }}>{count} {TEXTS.confirmDelete2}</Text> {TEXTS.confirmDelete3}
    </Text>
  );

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
          <View style={{ alignItems: 'center', marginBottom: 15 }}>
            <AlertTriangle size={48} color={colors.danger || '#ef4444'} />
          </View>

          <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 10 }]}>
            {title}
          </Text>

          {description}

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.danger || '#ef4444' }]}
            onPress={onConfirm}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              {TEXTS.deleteDefinitely}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: 'transparent', marginTop: 5 }]}
            onPress={onClose}
          >
            <Text style={{ color: colors.text, fontSize: 16 }}>
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
  modalDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22
  },
  deleteButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 5
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center'
  },
});