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
  home: HomeIcon,
  mail: MailIcon,
  palette: PaletteIcon,
  search: SearchIcon,
  star: StarIcon,
  profile_frame: ProfileFrame, 
} as IconMapping;

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
  const IconComponent = MAPPING[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      width={size}
      height={size}
      // choose fill or stroke depending on your SVGs
      fill={typeof color === 'string' ? color : undefined}
      style={style as any}
    />
  );
}