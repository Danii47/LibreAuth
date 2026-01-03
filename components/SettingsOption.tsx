import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { ExternalLink } from 'lucide-react-native';

interface SettingsOptionProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string | null;
  onPress: () => void;
  isLast?: boolean;
  colors: any;
  rightIcon?: React.ReactNode;
}

export const SettingsOption = ({
  icon,
  title,
  subtitle,
  onPress,
  isLast = false,
  colors,
  rightIcon
}: SettingsOptionProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.item,
        {
          borderBottomColor: colors.headerBorder || '#eee',
          borderBottomWidth: isLast ? 0 : 1
        }
      ]}
      onPress={onPress}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{ marginRight: 15 }}>
          {icon}
        </View>
        <View>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.itemSubtitle, { color: colors.subtext }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightIcon ? (
        rightIcon
      ) : (
        <ExternalLink size={16} color={colors.subtext} opacity={0.5} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});