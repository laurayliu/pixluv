import { ComponentType } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

import type { SvgProps } from 'react-native-svg';

// PIXLUX LOGO
import LOGO from '../../assets/logo.svg';

// homescreen + navbar icons
import HomeIcon from '../../assets/icons/home.svg';
import MailIcon from '../../assets/icons/mail.svg';
import PaletteIcon from '../../assets/icons/palette.svg';
import SearchIcon from '../../assets/icons/search.svg';
import StarIcon from '../../assets/icons/star.svg';
import ProfileFrame from '../../assets/icons/profile_frame.svg';

// post reaction buttons
import Like from '../../assets/icons/post_actions/heart_unfill.svg';
import Liked from '../../assets/icons/post_actions/heart_fill.svg';
import Comment from '../../assets/icons/post_actions/comment_unfill.svg';
import CommentView from '../../assets/icons/post_actions/comment_fill.svg';
import Save from '../../assets/icons/post_actions/save_unfill.svg';
import Saved from '../../assets/icons/post_actions/save_fill.svg';

// editor actions
import Undo from '../../assets/icons/editor/undo.svg';
import Redo from '../../assets/icons/editor/redo.svg';
import Lasso from '../../assets/icons/editor/lasso.svg';
import Line from '../../assets/icons/editor/line.svg';
import Fill from '../../assets/icons/editor/paintcan.svg';
import Square from '../../assets/icons/editor/square.svg';
import Circle from '../../assets/icons/editor/circle.svg';
import Erase from '../../assets/icons/editor/eraser.svg';
import Draw from '../../assets/icons/editor/pencil.svg';
import Dropper from '../../assets/icons/editor/dropper.svg';

// color panel thumb
import Thumb from '../../assets/icons/editor/thumb.svg';

type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  logo:           { component: LOGO,            fixed: false,    scale: 1.0  },
  home:           { component: HomeIcon,        fixed: true,     scale: 0.75 },
  mail:           { component: MailIcon,        fixed: true,     scale: 0.75 },
  palette:        { component: PaletteIcon,     fixed: true,     scale: 0.75 },
  search:         { component: SearchIcon,      fixed: false,    scale: 1.0  },
  star:           { component: StarIcon,        fixed: true,     scale: 0.75 },
  profile_frame:  { component: ProfileFrame,    fixed: true,     scale: 0.75 },
  like:           { component: Like,            fixed: true,     scale: 1.0 },
  liked:          { component: Liked,           fixed: true,     scale: 1.0 },
  comment:        { component: Comment,         fixed: true,     scale: 1.0 },
  commented:      { component: CommentView,     fixed: true,     scale: 1.0 },
  save:           { component: Save,            fixed: true,     scale: 1.0 },
  saved:          { component: Saved,           fixed: true,     scale: 1.0 },
  undo:           { component: Undo,            fixed: true,     scale: 1.0 },
  redo:           { component: Redo,            fixed: true,     scale: 1.0 },
  lasso:          { component: Lasso,           fixed: true,     scale: 1.0 },
  line:           { component: Line,            fixed: true,     scale: 1.0 },
  fill:           { component: Fill,            fixed: true,     scale: 1.0 },
  square:         { component: Square,          fixed: true,     scale: 1.0 },
  circle:         { component: Circle,          fixed: false,    scale: 1.0 },
  erase:          { component: Erase,           fixed: true,     scale: 1.0 },
  draw:           { component: Draw,            fixed: true,     scale: 1.0 },
  dropper:        { component: Dropper,         fixed: true,     scale: 1.0 },
  thumb:          { component: Thumb,           fixed: false,    scale: 1.0 },
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