import {
  Key, Mail, Briefcase, Home, User,
  Terminal, Code2, Cloud, Server, Wifi, Database,
  Gamepad2, Headphones, Camera, Music, Video, MessageCircle, Heart,
  ShoppingCart, CreditCard, Wallet, Landmark, Tag,
  ShieldCheck, Lock, Globe, Plane, Car, Gift,
  Folder
} from 'lucide-react-native';

// Mapeo: Nombre interno -> Componente
export const ICON_MAP: { [key: string]: any } = {
  default: Key,
  personal: User,
  home: Home,
  folder: Folder,
  email: Mail,
  
  dev: Terminal,
  work: Briefcase,
  code: Code2,
  cloud: Cloud,
  server: Server,
  wifi: Wifi,
  db: Database,

  social: MessageCircle,
  social2: Heart,
  game: Gamepad2,
  photo: Camera,
  music: Music,
  video: Video,
  audio: Headphones,

  shop: ShoppingCart,
  bank: Landmark,
  card: CreditCard,
  wallet: Wallet,
  promo: Tag,

  security: ShieldCheck,
  lock: Lock,
  web: Globe,
  travel: Plane,
  auto: Car,
  gift: Gift
};


export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
