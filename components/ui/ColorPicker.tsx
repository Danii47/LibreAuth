import { View, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { ACCOUNT_COLORS } from '@/constants/Colors';
import { useRef, useState } from 'react';

interface Props {
  selectedColor: string;
  onSelect: (color: string) => void;
  colors: any;
}

export const ColorPicker = ({ selectedColor, onSelect, colors }: Props) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  const [contentWidth, setContentWidth] = useState(0);
  const [visibleWidth, setVisibleWidth] = useState(0);

  const indicatorSize = contentWidth > visibleWidth
    ? (visibleWidth / contentWidth) * visibleWidth
    : visibleWidth;

  const indicatorTranslateX = scrollX.interpolate({
    inputRange: [0, contentWidth - visibleWidth],
    outputRange: [0, visibleWidth - indicatorSize],
    extrapolate: 'clamp',
  });

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onContentSizeChange={(width) => setContentWidth(width)}
        onLayout={(e) => setVisibleWidth(e.nativeEvent.layout.width)}
      >
        {ACCOUNT_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[styles.circle, { backgroundColor: color }]}
            onPress={() => onSelect(color)}
          >
            {selectedColor === color && <Check size={16} color="white" strokeWidth={3} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {contentWidth > visibleWidth && (
        <View style={[styles.track, { backgroundColor: colors.headerBorder }]}>
          <Animated.View
            style={[
              styles.indicator,
              {
                width: indicatorSize,
                backgroundColor: selectedColor,
                transform: [{ translateX: indicatorTranslateX }]
              }
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingVertical: 5, gap: 12, marginBottom: 10 },
  circle: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  track: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    marginBottom: 15,
    overflow: 'hidden',
  },
  indicator: {
    height: '100%',
    borderRadius: 2,
    opacity: 0.25
  }
});