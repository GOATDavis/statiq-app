import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FootballIconProps {
  size?: number;
  color?: string;
}

export function FootballIcon({ size = 24, color = '#b4d836' }: FootballIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160.616 160.616" style={{ transform: [{ rotate: '-45deg' }] }}>
      <Path d="M18.163,49.589L0,65.114v30.387l18.163,15.525v-61.438Z" fill={color} />
      <Path d="M142.453,49.589v61.438l18.163-15.525v-30.387l-18.163-15.525Z" fill={color} />
      <Path d="M128.413,37.588l-9.577-8.186H41.78l-9.577,8.186v85.44l9.577,8.186h77.057l9.577-8.186V37.588ZM60.251,94.883h-9.25v-29.151h9.25v29.151ZM76.706,94.883h-9.25v-29.151h9.25v29.151ZM93.161,94.883h-9.25v-29.151h9.25v29.151ZM109.615,94.883h-9.25v-29.151h9.25v29.151Z" fill={color} />
    </Svg>
  );
}
