import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface SearchIconProps {
  size?: number;
  color?: string;
}

export const SearchIcon: React.FC<SearchIconProps> = ({
  size = 24,
  color = '#999999'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 160.616 160.616">
      <Path d="M133.274,46.244L87.031,0h-36.79L0,50.241v36.79l46.244,46.244h36.79l50.241-50.241v-36.79h0ZM66.637,121.553L11.722,66.637,66.637,11.722l54.915,54.915-54.915,54.915h0Z" fill={color}/>
      <Rect x="125.589" y="109.993" width="19.883" height="51.073" transform="translate(-56.138 135.53) rotate(-45)" fill={color}/>
    </Svg>
  );
};
