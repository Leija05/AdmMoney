import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface StatSparklineProps {
  width?: number;
  height?: number;
  data?: number[];
  color?: string;
  gradientId?: string;
}

export const StatSparkline: React.FC<StatSparklineProps> = ({
  width = 90,
  height = 32,
  data = [12, 18, 14, 25, 22, 34, 40],
  color = '#10B981',
  gradientId = 'sparklineGrad',
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 4) + 2;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  // Build SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    pathD += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0.0" />
          </SvgLinearGradient>
        </Defs>
        <Path d={fillD} fill={`url(#${gradientId})`} />
        <Path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    </View>
  );
};
