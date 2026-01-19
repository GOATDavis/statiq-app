import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ShareIconProps {
  size?: number;
  color?: string;
}

export function ShareIcon({ size = 24, color = '#fff' }: ShareIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Arrow pointing up and out */}
      <Path
        d="M8.68397 10.3428L11.9996 7.02722M11.9996 7.02722L15.3152 10.3428M11.9996 7.02722L11.9996 16.0272"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Box */}
      <Path
        d="M16.9996 16.0272V17.0272C16.9996 18.1318 16.1042 19.0272 14.9996 19.0272H8.99961C7.89504 19.0272 6.99961 18.1318 6.99961 17.0272V16.0272"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
