import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CheckCircle, Circle, ChevronRight, GripVertical } from 'lucide-react-native'; // <--- Importado GripVertical
import { Folder } from '../types';
import { TEXTS } from '../constants/Languages';
import { getColors } from '../constants/Styles';
import { AppIcon } from './AppIcon';

interface Props {
  folder: Folder;
  onPress: (folder: Folder) => void;
  onLongPress: (folder: Folder) => void;
  selectionMode: boolean;
  isSelected: boolean;
  drag?: () => void;
  isActive?: boolean;
}

export const FolderCard = ({ folder, onPress, onLongPress, selectionMode, isSelected, drag, isActive }: Props) => {
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const handlePress = () => {
    if (isActive) return;

    if (selectionMode) {
      onPress(folder);
      Haptics.selectionAsync();
    } else {
      onPress(folder);
    }
  };

  const cardColor = folder.color || colors.tint;

  const backgroundColor = isActive
    ? (scheme === 'dark' ? '#444' : '#dcecfc')
    : (isSelected
      ? (scheme === 'dark' ? '#3A3A3C' : '#E8F0FE')
      : colors.card);

  const basePadding = 16;
  const borderSize = isSelected ? 2 : 0;

  const dynamicPaddingStyle = {
    paddingTop: basePadding - borderSize,
    paddingBottom: basePadding - borderSize,
    paddingRight: basePadding - borderSize,
    paddingLeft: basePadding - borderSize,
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: backgroundColor,
          borderWidth: isSelected ? 2 : 0,
          borderColor: cardColor,
          borderLeftColor: cardColor,
          borderLeftWidth: 6,
        }
      ]}
      onPress={handlePress}
      onLongPress={() => !isActive && !selectionMode && onLongPress(folder)}
      delayLongPress={300}
      activeOpacity={0.7}
      disabled={isActive}
    >
      <View style={[styles.contentContainer, dynamicPaddingStyle]}>
        {selectionMode && drag && (
          <TouchableOpacity onPressIn={drag} style={styles.dragHandleLeft}>
            <GripVertical size={24} color={colors.subtext} />
          </TouchableOpacity>
        )}

        <View style={styles.leftSection}>
          <View style={[styles.iconBox, { backgroundColor: cardColor + '15' }]}>
            <AppIcon name={folder.icon || 'home'} size={24} color={cardColor} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {folder.name}
            </Text>
            <Text style={[styles.itemsCount, { color: colors.subtext }]}>
              {TEXTS.folder}
            </Text>
          </View>
        </View>

        <View style={styles.rightSide}>
          {selectionMode ? (
            <View style={{ paddingLeft: 10 }}>
              {isSelected ? (
                <CheckCircle size={28} color={cardColor} />
              ) : (
                <Circle size={28} color={colors.subtext} />
              )}
            </View>
          ) : (
            <ChevronRight size={24} color={colors.subtext} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Estilo para el asa a la izquierda
  dragHandleLeft: {
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold' },
  itemsCount: { fontSize: 12, marginTop: 2 },
  rightSide: { flexDirection: 'row', alignItems: 'center' },
});