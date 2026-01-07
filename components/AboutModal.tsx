import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView, Image } from 'react-native';
import { GitBranch, Code, Heart, X } from 'lucide-react-native';
import { APP_GITHUB_URL, APP_NAME, APP_VERSION } from '@/constants/AppInformation';
import { TEXTS } from '@/constants/Languages';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  colors: any;
}

export const AboutModal = ({ visible, onClose, colors }: AboutModalProps) => {

  const handleOpenGithub = () => {
    Linking.openURL(APP_GITHUB_URL);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.modalBg }]}>

          {/* CLOSE BUTTON */}
          <View style={styles.header}>
            <View style={{ width: 24 }} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>

            {/* LOGO AND VERSION */}
            <View style={styles.logoSection}>
              <Image
                source={require('../assets/images/icon.png')}
                style={styles.appLogo}
              />
              <Text style={[styles.appName, { color: colors.text }]}>{APP_NAME}</Text>
              <Text style={[styles.version, { color: colors.subtext }]}>{APP_VERSION}</Text>
            </View>

            {/* DESCRIPTION */}
            <Text style={[styles.description, { color: colors.text }]}>
              {TEXTS.appDescription}
            </Text>

            {/* DEVELOPER SECTION */}
            <TouchableOpacity style={[styles.githubButton, { backgroundColor: colors.headerBg }]} onPress={handleOpenGithub}>
              <GitBranch size={20} color={colors.text} style={{ marginRight: 10 }} />
              <Text style={[styles.githubText, { color: colors.text }]}>{TEXTS.seeGitHub}</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.headerBorder || '#eee' }]} />

            {/* TECHNOLOGIES / CREDITS */}
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{TEXTS.technologiesAndCredits}</Text>

            <View style={styles.techList}>
              <TechItem name="React Native" role={TEXTS.frameworkCore} colors={colors} />
              <TechItem name="Expo" role={TEXTS.ecosystem} colors={colors} />
              <TechItem name="Expo Router" role={TEXTS.navigation} colors={colors} />
              <TechItem name="Lucide Icons" role={TEXTS.iconography} colors={colors} />
              <TechItem name="AsyncStorage" role={TEXTS.secureStorage} colors={colors} />
            </View>

            <View style={styles.footer}>
              <Heart size={14} color="#ef4444" style={{ marginHorizontal: 4 }} />
              <Text style={{ color: colors.subtext, fontSize: 12 }}>
                {TEXTS.createdWithLove}
              </Text>
            </View>

          </ScrollView>

          {/* CLOSE BUTTON */}
          <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.buttonBg }]} onPress={onClose}>
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{TEXTS.gotIt}</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

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
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 24,
    maxHeight: '85%',
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
  appLogo: {
    width: 120, 
    height: 120,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#aaa',
    marginBottom: 10,
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
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  }
});