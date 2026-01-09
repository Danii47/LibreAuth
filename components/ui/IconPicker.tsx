import { AppIcon } from '@/components/AppIcon';
import { AVAILABLE_ICONS } from '@/constants/Icons';
import { useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Props {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  selectedColor: string;
  colors: any;
}

export const IconPicker = ({ selectedIcon, onSelect, selectedColor, colors }: Props) => {
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

      {contentWidth > visibleWidth && (
        <View style={[styles.track, { backgroundColor: colors.headerBorder }]}>
          <Animated.View
            style={[
              styles.indicator,
              {
                width: indicatorSize,
                backgroundColor: selectedColor || colors.text,
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
  button: {
    width: 50, height: 50, borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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