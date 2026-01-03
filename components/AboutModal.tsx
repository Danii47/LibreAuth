import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView } from 'react-native';
import { ShieldCheck, GitBranch, Code, Heart, X } from 'lucide-react-native';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  colors: any;
}

export const AboutModal = ({ visible, onClose, colors }: AboutModalProps) => {

  const handleOpenGithub = () => {
    Linking.openURL('https://github.com/Danii47/LibreAuth');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.modalBg || 'white' }]}>

          {/* Close button */}
          <View style={styles.header}>
            <View style={{ width: 24 }} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>

            {/* LOGO AND VERSION */}
            <View style={styles.logoSection}>
              <View style={[styles.iconContainer, { backgroundColor: '#e0f2fe' }]}>
                <ShieldCheck size={48} color="#2e78b7" />
              </View>
              <Text style={[styles.appName, { color: colors.text }]}>LibreAuth</Text>
              <Text style={[styles.version, { color: colors.subtext }]}>v1.0.0</Text>
            </View>

            {/* DESCRIPTION */}
            <Text style={[styles.description, { color: colors.text }]}>
              Un autenticador de dos factores (2FA) seguro, privado y de código abierto. Tus claves nunca salen de tu dispositivo.
            </Text>

            {/* DEVELOPER SECTION */}
            <TouchableOpacity style={[styles.githubButton, { backgroundColor: colors.headerBg }]} onPress={handleOpenGithub}>
              <GitBranch size={20} color={colors.text} style={{ marginRight: 10 }} />
              <Text style={[styles.githubText, { color: colors.text }]}>Ver código en GitHub</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.headerBorder || '#eee' }]} />

            {/* TECHNOLOGIES / CREDITS */}
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>TECNOLOGÍAS & CRÉDITOS</Text>

            <View style={styles.techList}>
              <TechItem name="React Native" role="Framework Core" colors={colors} />
              <TechItem name="Expo" role="Ecosistema" colors={colors} />
              <TechItem name="Expo Router" role="Navegación" colors={colors} />
              <TechItem name="Lucide Icons" role="Iconografía" colors={colors} />
              <TechItem name="AsyncStorage" role="Almacenamiento Seguro" colors={colors} />
            </View>

            <View style={styles.footer}>
              <Heart size={14} color="#ef4444" style={{ marginHorizontal: 4 }} />
              <Text style={{ color: colors.subtext, fontSize: 12 }}>
                Creado con pasión por el Software Libre
              </Text>
            </View>

          </ScrollView>

          {/* Close button */}
          <TouchableOpacity style={[styles.doneButton]} onPress={onClose}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Entendido</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

// Subcomponente para items de tecnología
const TechItem = ({ name, role, colors }: { name: string, role: string, colors: any }) => (
  <View style={[styles.techItem, { borderBottomColor: colors.headerBorder || '#eee' }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Code size={16} color={colors.subtext} style={{ marginRight: 8 }} />
      <Text style={[styles.techName, { color: colors.text }]}>{name}</Text>
    </View>
    <Text style={[styles.techRole, { color: colors.subtext }]}>{role}</Text>
  </View>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end' // Bottom sheet style
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 24,
    maxHeight: '85%', // Ocupa casi toda la pantalla pero no toda
    paddingBottom: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 20
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  version: {
    fontSize: 14,
  },
  description: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 25,
    paddingHorizontal: 10
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20
  },
  githubText: {
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
    letterSpacing: 1
  },
  techList: {
    width: '100%',
    marginBottom: 30
  },
  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  techName: {
    fontSize: 15,
    fontWeight: '500'
  },
  techRole: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 10,
    opacity: 0.8
  },
  doneButton: {
    backgroundColor: '#202122',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  }
});