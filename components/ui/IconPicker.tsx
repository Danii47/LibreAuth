import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { AppIcon } from '../AppIcon';
import { AVAILABLE_ICONS } from '@/constants/Icons';

interface Props {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  selectedColor: string;
  colors: any;
}

export const IconPicker = ({ selectedIcon, onSelect, selectedColor, colors }: Props) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
    {AVAILABLE_ICONS.map((iconKey) => {
      const isSelected = selectedIcon === iconKey;
      return (
        <TouchableOpacity
          key={iconKey}
          style={[
            styles.button,
            {
              backgroundColor: isSelected ? selectedColor : colors.card,
              borderColor: isSelected ? selectedColor : colors.headerBorder || '#ccc',
              borderWidth: 1
            }
          ]}
          onPress={() => onSelect(iconKey)}
        >
          <AppIcon name={iconKey} size={24} color={isSelected ? 'white' : colors.text} />
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  scroll: { paddingVertical: 5, gap: 12, marginBottom: 20 },
  button: {
    width: 50, height: 50, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  }
});