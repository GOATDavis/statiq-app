import React from 'react';
import { Image, ImageStyle } from 'react-native';

interface FollowingIconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

export function FollowingIcon({ size = 24, color = '#FFFFFF', filled = false }: FollowingIconProps) {
  const imageStyle: ImageStyle = {
    width: size,
    height: size,
    tintColor: color,
  };

  return (
    <Image
      source={filled 
        ? require('@/assets/images/following-icon-filled-halo.png')
        : require('@/assets/images/following-icon-outline-halo.png')
      }
      style={imageStyle}
      resizeMode="contain"
    />
  );
}
