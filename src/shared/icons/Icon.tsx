import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'plus'
  | 'x'
  | 'send'
  | 'send2'
  | 'search'
  | 'users'
  | 'map'
  | 'pin'
  | 'chat'
  | 'bell'
  | 'home'
  | 'compass'
  | 'radar'
  | 'dot'
  | 'lock'
  | 'globe'
  | 'building'
  | 'calendar'
  | 'coffee'
  | 'leaf'
  | 'more'
  | 'back'
  | 'check'
  | 'image'
  | 'mic'
  | 'sparkle'
  | 'signal';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const stroke = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function renderPaths(name: IconName, color: string): React.ReactNode {
  switch (name) {
    case 'chevronLeft':
      return <Path d="M13 4l-6 6 6 6" />;
    case 'chevronRight':
      return <Path d="M7 4l6 6-6 6" />;
    case 'chevronDown':
      return <Path d="M4 7l6 6 6-6" />;
    case 'plus':
      return <Path d="M10 4v12M4 10h12" />;
    case 'x':
      return <Path d="M5 5l10 10M15 5L5 15" />;
    case 'send':
      return <Path d="M3 10L17 3l-4 14-3-6-7-1z" />;
    case 'send2':
      return <Path d="M3 10l14-7-7 14-2-6-5-1z" />;
    case 'search':
      return (
        <>
          <Circle cx={9} cy={9} r={5} />
          <Path d="M13 13l4 4" />
        </>
      );
    case 'users':
      return (
        <>
          <Circle cx={7} cy={7} r={3} />
          <Path d="M2 17c0-3 3-5 5-5s5 2 5 5" />
          <Circle cx={14} cy={8} r={2.5} />
          <Path d="M18 17c0-2.5-2-4-4-4" />
        </>
      );
    case 'map':
      return (
        <>
          <Path d="M1 5l6-2 6 2 6-2v14l-6 2-6-2-6 2V5z" />
          <Path d="M7 3v14M13 5v14" />
        </>
      );
    case 'pin':
      return (
        <>
          <Path d="M10 2a5 5 0 015 5c0 4-5 10-5 10S5 11 5 7a5 5 0 015-5z" />
          <Circle cx={10} cy={7} r={2} />
        </>
      );
    case 'chat':
      return (
        <Path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2h-5l-4 3v-3H5a2 2 0 01-2-2V5z" />
      );
    case 'bell':
      return (
        <>
          <Path d="M10 2a5 5 0 00-5 5v3l-1.5 3h13L15 10V7a5 5 0 00-5-5z" />
          <Path d="M8 16a2 2 0 004 0" />
        </>
      );
    case 'home':
      return (
        <Path d="M3 9l7-6 7 6v8a1 1 0 01-1 1h-4v-6H8v6H4a1 1 0 01-1-1V9z" />
      );
    case 'compass':
      return (
        <>
          <Circle cx={10} cy={10} r={8} />
          <Path d="M13 7l-2 5-5 2 2-5 5-2z" />
        </>
      );
    case 'radar':
      return (
        <>
          <Circle cx={10} cy={10} r={3} />
          <Circle cx={10} cy={10} r={6} />
          <Circle cx={10} cy={10} r={9} />
        </>
      );
    case 'dot':
      return <Circle cx={10} cy={10} r={3} fill={color} />;
    case 'lock':
      return (
        <>
          <Rect x={4} y={9} width={12} height={8} rx={1.5} />
          <Path d="M7 9V6a3 3 0 016 0v3" />
        </>
      );
    case 'globe':
      return (
        <>
          <Circle cx={10} cy={10} r={8} />
          <Path d="M2 10h16M10 2c2.5 3 2.5 13 0 16M10 2c-2.5 3-2.5 13 0 16" />
        </>
      );
    case 'building':
      return (
        <>
          <Rect x={4} y={3} width={12} height={15} rx={1} />
          <Path d="M7 7h2M11 7h2M7 10h2M11 10h2M7 13h2M11 13h2" />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x={3} y={5} width={14} height={13} rx={1.5} />
          <Path d="M3 9h14M7 2v4M13 2v4" />
        </>
      );
    case 'coffee':
      return (
        <>
          <Path d="M3 8h11v5a3 3 0 01-3 3H6a3 3 0 01-3-3V8z" />
          <Path d="M14 10h1.5a1.5 1.5 0 010 3H14M6 2v3M9 2v3M12 2v3" />
        </>
      );
    case 'leaf':
      return <Path d="M3 17c0-8 6-14 14-14 0 8-6 14-14 14zM3 17l7-7" />;
    case 'more':
      return (
        <>
          <Circle cx={5} cy={10} r={1.5} fill={color} />
          <Circle cx={10} cy={10} r={1.5} fill={color} />
          <Circle cx={15} cy={10} r={1.5} fill={color} />
        </>
      );
    case 'back':
      return <Path d="M12 4l-6 6 6 6M6 10h13" />;
    case 'check':
      return <Path d="M4 10l4 4 8-8" />;
    case 'image':
      return (
        <>
          <Rect x={3} y={3} width={14} height={14} rx={1.5} />
          <Circle cx={7} cy={7.5} r={1.2} />
          <Path d="M3 14l4-4 5 5 3-3 2 2" />
        </>
      );
    case 'mic':
      return (
        <>
          <Rect x={8} y={2} width={4} height={10} rx={2} />
          <Path d="M5 10a5 5 0 0010 0M10 15v3" />
        </>
      );
    case 'sparkle':
      return <Path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5L10 2z" />;
    case 'signal':
      return (
        <>
          <Path
            d="M2 14c0-4 3-7 8-7M2 14c0-6 5-11 11-11M2 14c0-8 7-15 15-15"
            opacity={0.7}
          />
          <Circle cx={3} cy={14} r={1.5} fill={color} />
        </>
      );
  }
}

export function Icon({
  name,
  size = 20,
  color = '#000',
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      stroke={color}
      strokeWidth={strokeWidth}
      {...stroke}
    >
      {renderPaths(name, color)}
    </Svg>
  );
}
