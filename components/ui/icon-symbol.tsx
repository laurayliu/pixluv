import { ComponentType } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

import type { SvgProps } from 'react-native-svg';
import HomeIcon from '../../assets/icons/home.svg';
import MailIcon from '../../assets/icons/mail.svg';
import PaletteIcon from '../../assets/icons/palette.svg';
import SearchIcon from '../../assets/icons/search.svg';
import StarIcon from '../../assets/icons/star.svg';
import ProfileFrame from '../../assets/icons/profile_frame.svg';


type IconMapping = Record<string, ComponentType<SvgProps>>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  home:        { component: HomeIcon,        fixed: true,     scale: 0.75 },
  mail:        { component: MailIcon,        fixed: true,     scale: 0.75 },
  palette:     { component: PaletteIcon,     fixed: true,     scale: 0.75 },
  search:      { component: SearchIcon,      fixed: false,     scale: 1.0 },
  star:        { component: StarIcon,        fixed: true,     scale: 0.75 },
  profile_frame: { component: ProfileFrame,  fixed: true,     scale: 0.75 },
} as const;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  const { component: IconComponent, fixed, scale } = MAPPING[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      {...(!fixed && { width: size, height: size })}
      fill={typeof color === 'string' ? color : undefined}
      style={[
        {transform: [{scale}]},
      ]}
    />
  );
}