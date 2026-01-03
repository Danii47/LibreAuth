import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { CheckCircle, Circle, GripVertical } from 'lucide-react-native';
import { useEffect, useRef, useState, memo } from 'react'; // Mantén memo
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
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
  drag?: () => void;
  isActive?: boolean;
}

export const TotpCard = memo(({ account, onPress, onLongPress, selectionMode, isSelected, drag, isActive }: Props) => {

  const scheme = useColorScheme();
  const colors = getColors(scheme);
  const [code, setCode] = useState("000000");
  const [progress, setProgress] = useState(1);
  const [isRevealed, setIsRevealed] = useState(false);
  const lastCode = useRef("");
  const revealTimeout = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
    };
  }, [account.secret]);

  const animateTransition = (show: boolean) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setIsRevealed(show);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handlePress = async () => {
    if (isActive) return;

    if (selectionMode) {
      onPress(account);
      Haptics.selectionAsync();
    } else {
      await Clipboard.setStringAsync(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (isRevealed) {
        if (revealTimeout.current) clearTimeout(revealTimeout.current);
        revealTimeout.current = setTimeout(() => animateTransition(false), 10000);
        return;
      }
      animateTransition(true);
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
      revealTimeout.current = setTimeout(() => animateTransition(false), 10000);
    }
  };

  const cardColor = account.color || colors.tint;
  const backgroundColor = isActive
    ? (scheme === 'dark' ? '#444' : '#dcecfc')
    : (isSelected
      ? (scheme === 'dark' ? '#3A3A3C' : '#E8F0FE')
      : colors.card);

  const basePadV = 18;
  const basePadH = 16;
  const borderSize = isSelected ? 2 : 0;

  const dynamicPaddingStyle = {
    paddingTop: basePadV - borderSize,
    paddingBottom: basePadV - borderSize,
    paddingRight: basePadH - borderSize,
    paddingLeft: basePadH - borderSize
  };

  const codeDisplay = isRevealed ? `${code.slice(0, 3)} ${code.slice(3)}` : "••• •••";

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
          transform: [{ scale: isActive ? 1.03 : 1 }]
        }
      ]}
      onPress={handlePress}
      onLongPress={() => !isActive && !selectionMode && onLongPress(account)}
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

        <View style={styles.centerSection}>
          <View style={[styles.iconBox, { backgroundColor: cardColor + '20' }]}>
            <AppIcon name={account.icon} size={24} color={cardColor} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {account.name}
            </Text>
            <Text style={[styles.issuer, { color: colors.subtext }]}>
              {account.issuer || TEXTS.unknownIssuer}
            </Text>
          </View>
        </View>

        <View style={styles.rightSide}>
          {selectionMode ? (
            <View style={{ paddingLeft: 10 }}>
              {isSelected ? <CheckCircle size={28} color={cardColor} fontWeight="fill" /> : <Circle size={28} color={colors.subtext} />}
            </View>
          ) : (
            <>
              <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={[styles.code, { color: cardColor }, !isRevealed && styles.hiddenCode]}>
                  {codeDisplay}
                </Text>
              </Animated.View>
              <View style={styles.timerWrapper}>
                <CircularTimer size={26} progress={progress} color={cardColor} />
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

TotpCard.displayName = 'TotpCard';

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: { flexDirection: 'row', alignItems: 'center' },
  dragHandleLeft: {
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSection: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 6 },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  textContainer: { justifyContent: 'center', flex: 1 },
  issuer: { fontSize: 12, fontWeight: '600', marginBottom: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  rightSide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  code: { fontSize: 20, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginRight: 8 },
  hiddenCode: { fontSize: 24, letterSpacing: -2, opacity: 0.6 },
  timerWrapper: { justifyContent: 'center', alignItems: 'center' }
});