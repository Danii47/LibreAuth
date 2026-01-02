import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { CheckCircle, Circle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { TEXTS } from '../constants/Languages';
import { getColors } from '../constants/Styles';
import { Account } from '../types';
import { generateTOTP } from '../utils/totp';
import { AppIcon } from './AppIcon';
import { CircularTimer } from './CircularTimer';

interface Props {
  account: Account;
  onPress: (account: Account) => void;
  onLongPress: (account: Account) => void;
  selectionMode: boolean;
  isSelected: boolean;
}

export const TotpCard = ({ account, onPress, onLongPress, selectionMode, isSelected }: Props) => {
  const scheme = useColorScheme();
  const colors = getColors(scheme);

  const [code, setCode] = useState("000000");
  const [progress, setProgress] = useState(1);
  const lastCode = useRef("");

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      const now = Date.now();
      const remainingMs = 30000 - (now % 30000);
      setProgress(remainingMs / 30000);

      const newCode = generateTOTP(account.secret);
      if (newCode !== lastCode.current) {
        setCode(newCode);
        lastCode.current = newCode;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => { if (animationFrameId) cancelAnimationFrame(animationFrameId); };
  }, [account.secret]);

  const handlePress = async () => {
    if (selectionMode) {
      onPress(account);
      Haptics.selectionAsync();
    } else {
      await Clipboard.setStringAsync(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const cardColor = account.color || colors.tint;

  const backgroundColor = isSelected
    ? (scheme === 'dark' ? '#3A3A3C' : '#E8F0FE')
    : colors.card;

  const basePadV = 18;
  const basePadH = 16;

  const borderSize = isSelected ? 2 : 0;

  const dynamicPaddingStyle = {
    paddingTop: basePadV - borderSize,
    paddingBottom: basePadV - borderSize,
    paddingRight: basePadH - borderSize,
    paddingLeft: basePadH
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: backgroundColor,
          borderWidth: isSelected ? 2 : 0,
          borderColor: cardColor,
          borderLeftWidth: 6,
          borderLeftColor: cardColor,
        }
      ]}
      onPress={handlePress}
      onLongPress={() => onLongPress(account)}
      delayLongPress={400}
      activeOpacity={0.7}
    >
      <View style={[styles.contentContainer, dynamicPaddingStyle]}>

        {/* LEFT */}
        <View style={styles.leftSection}>
          <View style={[styles.iconBox, { backgroundColor: cardColor + '20' }]}>
            <AppIcon
              name={account.icon}
              size={24}
              color={cardColor}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.issuer, { color: colors.subtext }]}>
              {account.issuer || TEXTS.unknownIssuer}
            </Text>
            <Text style={[styles.name, { color: colors.text }]}>
              {account.name}
            </Text>
          </View>
        </View>

        {/* RIGHT */}
        <View style={styles.rightSide}>
          {selectionMode ? (
            <View style={{ paddingLeft: 10 }}>
              {isSelected ? (
                <CheckCircle size={28} color={cardColor} fontWeight="fill" />
              ) : (
                <Circle size={28} color={colors.subtext} />
              )}
            </View>
          ) : (
            <>
              <Text style={[styles.code, { color: cardColor }]}>
                {code.slice(0, 3)} {code.slice(3)}
              </Text>
              <View style={styles.timerWrapper}>
                <CircularTimer size={26} progress={progress} color={cardColor} />
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginRight: 12,
  },
  textContainer: {
    justifyContent: 'center',
    flex: 1
  },
  issuer: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  name: { fontSize: 16, fontWeight: 'bold' },
  rightSide: { flexDirection: 'row', alignItems: 'center' },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginRight: 12
  },
  timerWrapper: { justifyContent: 'center', alignItems: 'center' }
});