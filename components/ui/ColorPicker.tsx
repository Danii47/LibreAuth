import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { ACCOUNT_COLORS } from '@/constants/Colors';

interface Props {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export const ColorPicker = ({ selectedColor, onSelect }: Props) => (
  <View style={styles.container}>
    {ACCOUNT_COLORS.map((color) => (
      <TouchableOpacity
        key={color}
        style={[styles.circle, { backgroundColor: color }]}
        onPress={() => onSelect(color)}
      >
        {selectedColor === color && <Check size={16} color="white" strokeWidth={3} />}
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  circle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2
  }
});