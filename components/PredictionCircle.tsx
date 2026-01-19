import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { Colors } from '@/src/constants/design';
import { getDisplayColor } from '@/src/lib/utils/colors';

interface PredictionCircleProps {
  homePercentage: number;
  awayPercentage: number;
  homeColor: string;
  awayColor: string;
  size?: number;
}

export function PredictionCircle({
  homePercentage,
  awayPercentage,
  homeColor,
  awayColor,
  size = 200,
}: PredictionCircleProps) {
  // Lighten dark colors for better visibility on dark backgrounds
  const displayHomeColor = getDisplayColor(homeColor);
  const displayAwayColor = getDisplayColor(awayColor);
  
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Helper function to get point on circle (starts from top, goes clockwise)
  const getPoint = (percentage: number) => {
    const angle = (percentage / 100) * 2 * Math.PI;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };
  
  // Helper to create arc path
  const createArc = (startPercent: number, endPercent: number) => {
    const start = getPoint(startPercent);
    const end = getPoint(endPercent);
    const largeArc = (endPercent - startPercent) > 50 ? 1 : 0;
    
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${centerX}, ${centerY}`}>
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            stroke="#1a1a1a"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          <Path
            d={createArc(0, homePercentage)}
            stroke={displayHomeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          
          <Path
            d={createArc(homePercentage, homePercentage + awayPercentage)}
            stroke={displayAwayColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="butt"
          />
          
          <Circle
            cx={getPoint(0).x}
            cy={getPoint(0).y}
            r={strokeWidth / 2}
            fill={displayHomeColor}
          />
          <Circle
            cx={getPoint(homePercentage).x}
            cy={getPoint(homePercentage).y}
            r={strokeWidth / 2}
            fill={displayHomeColor}
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
