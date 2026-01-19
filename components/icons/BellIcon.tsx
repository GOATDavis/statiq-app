import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface BellIconProps {
  size?: number;
  color?: string;
}

export function BellIcon({ size = 24, color = '#b4d836' }: BellIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bell outline */}
      <Path
        d="M12 2C11.172 2 10.5 2.672 10.5 3.5V4.197C8.13 4.862 6.5 7.027 6.5 9.5V14L4.5 16V17H19.5V16L17.5 14V9.5C17.5 7.027 15.87 4.862 13.5 4.197V3.5C13.5 2.672 12.828 2 12 2Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bell clapper */}
      <Path
        d="M9 17C9 18.6569 10.3431 20 12 20C13.6569 20 15 18.6569 15 17"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
