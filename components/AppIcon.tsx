import { ICON_MAP } from '../constants/Icons';
import { Key } from 'lucide-react-native';

interface Props {
  name?: string;
  size?: number;
  color?: string;
}

export const AppIcon = ({ name, size = 24, color = '#000' }: Props) => {
  const IconComponent = ICON_MAP[name || 'default'] || Key;

  return <IconComponent size={size} color={color} />;
};