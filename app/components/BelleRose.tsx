import React from 'react';
import Svg, { Path, Ellipse, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

interface BelleRoseProps {
  size?: number;
}

export default function BelleRose({ size = 120 }: BelleRoseProps) {
  return (
    <Svg width={size} height={size * 0.95} viewBox="0 0 120 114">
      <Defs>
        <RadialGradient id="petalOuter" cx="50%" cy="40%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#f4a0b5" />
          <Stop offset="100%" stopColor="#d4607a" />
        </RadialGradient>
        <RadialGradient id="petalMid" cx="50%" cy="40%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#e8809a" />
          <Stop offset="100%" stopColor="#c44868" />
        </RadialGradient>
        <RadialGradient id="petalInner" cx="50%" cy="30%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#d4607a" />
          <Stop offset="100%" stopColor="#a83050" />
        </RadialGradient>
        <RadialGradient id="petalCenter" cx="50%" cy="30%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#c04060" />
          <Stop offset="100%" stopColor="#8a2040" />
        </RadialGradient>
      </Defs>

      {/* Book - left page */}
      <Path
        d="M60 30 Q30 25 10 33 L10 95 Q30 87 60 93 Z"
        fill="#f5e6c8"
        stroke="#c9a96e"
        strokeWidth={1}
      />

      {/* Book - right page */}
      <Path
        d="M60 30 Q90 25 110 33 L110 95 Q90 87 60 93 Z"
        fill="#faf0dc"
        stroke="#c9a96e"
        strokeWidth={1}
      />

      {/* Book spine */}
      <Line x1="60" y1="30" x2="60" y2="93" stroke="#c9a96e" strokeWidth={1.5} />

      {/* Page lines - left */}
      <Line x1="22" y1="47" x2="52" y2="45" stroke="#e0d0b0" strokeWidth={0.7} />
      <Line x1="22" y1="55" x2="52" y2="53" stroke="#e0d0b0" strokeWidth={0.7} />
      <Line x1="22" y1="63" x2="52" y2="61" stroke="#e0d0b0" strokeWidth={0.7} />
      <Line x1="22" y1="71" x2="52" y2="69" stroke="#e0d0b0" strokeWidth={0.7} />

      {/* Page lines - right */}
      <Line x1="68" y1="45" x2="98" y2="47" stroke="#e0d0b0" strokeWidth={0.7} />
      <Line x1="68" y1="53" x2="98" y2="55" stroke="#e0d0b0" strokeWidth={0.7} />
      <Line x1="68" y1="61" x2="98" y2="63" stroke="#e0d0b0" strokeWidth={0.7} />
      <Line x1="68" y1="69" x2="98" y2="71" stroke="#e0d0b0" strokeWidth={0.7} />

      {/* Rose stem */}
      <Path
        d="M60 60 Q59 48 60 36 Q60.5 28 59 18"
        stroke="#2e7d46"
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />

      {/* Stem highlight */}
      <Path
        d="M60.8 58 Q60 47 60.8 37 Q61 30 60 20"
        stroke="#4a9e64"
        strokeWidth={0.6}
        fill="none"
        strokeLinecap="round"
      />

      {/* Left leaf */}
      <Path
        d="M59 42 Q50 36 46 39 Q47 42 53 42 Q56 42 59 42"
        fill="#3d8b57"
      />
      <Path
        d="M59 42 Q52 39 48 40"
        stroke="#2e7d46"
        strokeWidth={0.5}
        fill="none"
      />

      {/* Right leaf */}
      <Path
        d="M60 52 Q69 46 73 49 Q72 52 66 52 Q63 52 60 52"
        fill="#3d8b57"
      />
      <Path
        d="M60 52 Q67 49 71 50"
        stroke="#2e7d46"
        strokeWidth={0.5}
        fill="none"
      />

      {/* Small thorn */}
      <Path d="M59 46 L56.5 44.5 L59 45.5" fill="#2e7d46" />

      {/* ---- ROSE HEAD ---- */}

      {/* Back petals (largest, lightest) */}
      <Path
        d="M59 16 Q48 10 46 4 Q48 -2 55 0 Q59 1 59 6"
        fill="url(#petalOuter)"
      />
      <Path
        d="M59 16 Q70 10 72 4 Q70 -2 63 0 Q59 1 59 6"
        fill="url(#petalOuter)"
      />

      {/* Side petals */}
      <Path
        d="M59 14 Q49 12 47 6 Q48 1 54 2 Q58 3 59 8"
        fill="url(#petalMid)"
      />
      <Path
        d="M59 14 Q69 12 71 6 Q70 1 64 2 Q60 3 59 8"
        fill="url(#petalMid)"
      />

      {/* Front petals curving outward */}
      <Path
        d="M59 14 Q52 11 50 7 Q51 3 56 4 Q59 5 59 9"
        fill="url(#petalInner)"
      />
      <Path
        d="M59 14 Q66 11 68 7 Q67 3 62 4 Q59 5 59 9"
        fill="url(#petalInner)"
      />

      {/* Center bud - tight spiral */}
      <Ellipse cx="59" cy="8" rx="5" ry="5" fill="url(#petalCenter)" />
      <Path
        d="M57 8 Q58 4 60 5 Q62 6 61 9 Q60 11 58 10 Q56 9 57 7"
        fill="#a83050"
      />
      <Path
        d="M58.5 7 Q59 5.5 60 6.5 Q60.5 7.5 59.5 8"
        fill="#8a2040"
      />

      {/* Petal edge highlights */}
      <Path
        d="M50 8 Q48 5 50 3"
        stroke="#f0b0c0"
        strokeWidth={0.4}
        fill="none"
      />
      <Path
        d="M68 8 Q70 5 68 3"
        stroke="#f0b0c0"
        strokeWidth={0.4}
        fill="none"
      />

      {/* Calyx (green base of rose) */}
      <Path
        d="M56 16 Q59 13 62 16"
        fill="#2e7d46"
      />
      <Path
        d="M55 16 L54 13 L57 15 M63 16 L64 13 L61 15"
        stroke="#2e7d46"
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
