import React from 'react';
import {
  Zap,
  Waves,
  Dumbbell,
  ShieldCheck,
  Car,
  Sun,
  Home,
  Trees,
  Heart,
  Wifi,
  PhoneCall,
  Layers,
  Sparkles,
  CheckCircle,
} from 'lucide-react-native';

interface AmenityIconProps {
  name: string;
  size?: number;
  color?: string;
}

export const AmenityIcon: React.FC<AmenityIconProps> = ({ name, size = 18, color = '#2563eb' }) => {
  const normalized = (name || '').toLowerCase();

  if (normalized.includes('lift') || normalized.includes('elevator')) {
    return <Layers size={size} color={color} />;
  }
  if (normalized.includes('power') || normalized.includes('backup') || normalized.includes('generator')) {
    return <Zap size={size} color={color} />;
  }
  if (normalized.includes('pool') || normalized.includes('swim')) {
    return <Waves size={size} color={color} />;
  }
  if (normalized.includes('gym') || normalized.includes('fitness') || normalized.includes('workout')) {
    return <Dumbbell size={size} color={color} />;
  }
  if (normalized.includes('security') || normalized.includes('cctv') || normalized.includes('guard')) {
    return <ShieldCheck size={size} color={color} />;
  }
  if (normalized.includes('parking') || normalized.includes('garage') || normalized.includes('car')) {
    return <Car size={size} color={color} />;
  }
  if (normalized.includes('balcony') || normalized.includes('terrace') || normalized.includes('deck')) {
    return <Sun size={size} color={color} />;
  }
  if (normalized.includes('club') || normalized.includes('community') || normalized.includes('hall')) {
    return <Home size={size} color={color} />;
  }
  if (normalized.includes('garden') || normalized.includes('park') || normalized.includes('lawn')) {
    return <Trees size={size} color={color} />;
  }
  if (normalized.includes('pet')) {
    return <Heart size={size} color={color} />;
  }
  if (normalized.includes('wifi') || normalized.includes('internet') || normalized.includes('broadband')) {
    return <Wifi size={size} color={color} />;
  }
  if (normalized.includes('intercom') || normalized.includes('phone')) {
    return <PhoneCall size={size} color={color} />;
  }

  return <Sparkles size={size} color={color} />;
};
