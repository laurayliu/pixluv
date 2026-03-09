import React from 'react';
import { Image, View } from 'react-native';
import ProfileFrameSVG from '../../assets/icons/profile_frame.svg';

type Props = {
  imageUrl?: string | null;
  size?: number;
};

export function ProfileAvatar({ imageUrl, size = 39 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2 }}
        />
      ) : null}
      <ProfileFrameSVG width={size} height={size} />
    </View>
  );
}
