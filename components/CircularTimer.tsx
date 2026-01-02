import Svg, { Circle } from 'react-native-svg';
import { View } from 'react-native';

interface Props {
  size?: number;
  progress: number;
  color: string;
}

export const CircularTimer = ({ size = 24, progress, color }: Props) => {
  const radius = (size - 4) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ transform: [{ rotate: '-90deg' }] }}>
      <Svg width={size} height={size}>
        <Circle
          stroke={color}
          strokeOpacity={0.15}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={3}
          fill="none"
        />
        <Circle
          stroke={color}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={3}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};