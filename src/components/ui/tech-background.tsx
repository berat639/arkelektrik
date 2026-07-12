import React from 'react';

export function TechBackground({ variant = 'default' }: { variant?: 'default' | 'alt' | 'dark' }) {
  const isDark = variant === 'dark';
  const isAlt = variant === 'alt';

  const dotColor = isDark ? '#7BA3A7' : '#7BA3A7';
  const circleStroke = isDark ? '#7BA3A7' : '#5FB5B5';
  const circleFill = isDark ? '#7BA3A7' : '#5FB5B5';
  const stripeFill = isDark ? 'rgba(123,163,167,0.12)' : 'rgba(95,181,181,0.32)';
  const squareFill = isDark ? 'rgba(123,163,167,0.18)' : 'rgba(95,181,181,0.28)';
  const protractorStroke = isDark ? 'rgba(102,102,102,0.5)' : 'rgba(95,181,181,0.55)';
  const axisColor = isDark ? 'rgba(102,102,102,0.45)' : 'rgba(95,181,181,0.5)';
  const accentRed = '#2A9D8F';
  const textColor = isDark ? 'rgba(102,102,102,0.6)' : 'rgba(95,181,181,0.7)';

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
      aria-hidden="true"
    >
      <defs>
        <pattern id={`dots-${variant}`} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1.2" fill={dotColor} opacity="0.6" />
        </pattern>
        <clipPath id={`clip-proto-${variant}`}>
          <rect x="340" y="180" width="480" height="300" />
        </clipPath>
      </defs>

      {/* Dot grid */}
      <rect width="1440" height="900" fill={`url(#dots-${variant})`} opacity="0.85" />

      {/* Large translucent circles - left */}
      <circle cx="80" cy="160" r="200" fill="none" stroke={circleStroke} strokeWidth="2" opacity="0.6" />
      <circle cx="80" cy="160" r="130" fill={circleFill} opacity={isAlt ? 0.22 : 0.18} />
      <circle cx="80" cy="160" r="55" fill="none" stroke={circleStroke} strokeWidth="1.5" opacity="0.7" />
      <circle cx="80" cy="160" r="12" fill={circleFill} opacity="0.85" />

      {/* Second large circle lower left */}
      <circle cx="200" cy="820" r="180" fill={circleFill} opacity={isAlt ? 0.2 : 0.16} />
      <circle cx="200" cy="820" r="120" fill="none" stroke={circleStroke} strokeWidth="1.5" opacity="0.55" />

      {/* Diagonal stripe top-left */}
      <rect
        x="-60" y="80"
        width="380" height="90"
        fill={stripeFill}
        transform="rotate(-30 150 120)"
      />
      <rect
        x="-60" y="190"
        width="380" height="50"
        fill={stripeFill}
        transform="rotate(-30 150 200)"
      />

      {/* Squares / rectangles - geometric blocks */}
      <rect x="1180" y="60" width="90" height="90" fill={squareFill} transform="rotate(15 1225 105)" />
      <rect x="1290" y="110" width="55" height="55" fill={squareFill} transform="rotate(-10 1318 138)" />
      <rect x="1340" y="30" width="28" height="28" fill={squareFill} transform="rotate(5 1354 44)" />

      {/* Small squares scatter */}
      <rect x="620" y="820" width="40" height="40" fill={squareFill} transform="rotate(20 640 840)" />
      <rect x="700" y="840" width="22" height="22" fill={squareFill} transform="rotate(-15 711 851)" />

      {/* Protractor / semicircle - centered */}
      <g transform={isAlt ? 'translate(780, 480)' : 'translate(580, 460)'} opacity="0.8">
        {/* Outer arc */}
        <path
          d="M -200 0 A 200 200 0 0 1 200 0"
          fill="none"
          stroke={protractorStroke}
          strokeWidth="1.5"
        />
        {/* Degree tick marks */}
        {Array.from({ length: 19 }, (_, i) => {
          const angleDeg = i * 10;
          const rad = (angleDeg * Math.PI) / 180;
          const cos = Math.cos(Math.PI - rad);
          const sin = Math.sin(Math.PI - rad);
          const r1 = 200, r2 = i % 9 === 0 ? 185 : i % 3 === 0 ? 190 : 194;
          return (
            <line
              key={i}
              x1={Number((r1 * cos).toFixed(4))} y1={Number((-r1 * sin).toFixed(4))}
              x2={Number((r2 * cos).toFixed(4))} y2={Number((-r2 * sin).toFixed(4))}
              stroke={protractorStroke}
              strokeWidth={i % 9 === 0 ? 1.5 : 0.8}
            />
          );
        })}
        {/* Degree labels */}
        {[0, 30, 60, 90, 120, 150, 180].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const cos = Math.cos(Math.PI - rad);
          const sin = Math.sin(Math.PI - rad);
          const r = 175;
          return (
            <text
              key={deg}
              x={Number((r * cos).toFixed(4))} y={Number((-r * sin + 4).toFixed(4))}
              textAnchor="middle"
              fontSize="9"
              fill={textColor}
            >
              {deg}
            </text>
          );
        })}
        {/* Center dot */}
        <circle cx="0" cy="0" r="3" fill={protractorStroke} />
        {/* Measurement arm */}
        <line x1="0" y1="0" x2="0" y2="-210" stroke={protractorStroke} strokeWidth="1" />
        <line x1="0" y1="0" x2="150" y2="-100" stroke={protractorStroke} strokeWidth="1" strokeDasharray="4 3" />
        <rect x="-4" y="-10" width="8" height="10" fill={axisColor} opacity="0.7" />
      </g>

      {/* W-E compass axis */}
      <g transform={isAlt ? 'translate(400, 540)' : 'translate(210, 550)'} opacity="0.65">
        <line x1="-160" y1="0" x2="160" y2="0" stroke={axisColor} strokeWidth="1" markerEnd="url(#arrowE)" markerStart="url(#arrowW)" />
        <defs>
          <marker id="arrowE" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={axisColor} />
          </marker>
          <marker id="arrowW" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 Z" fill={axisColor} />
          </marker>
        </defs>
        <text x="-172" y="4" fontSize="11" fill={textColor} fontFamily="monospace">W</text>
        <text x="168" y="4" fontSize="11" fill={textColor} fontFamily="monospace">E</text>
        {/* Vertical axis */}
        <line x1="0" y1="-80" x2="0" y2="0" stroke={axisColor} strokeWidth="1" />
        <polygon points="0,-88 -4,-78 4,-78" fill={axisColor} />
      </g>

      {/* Curly brace { } ornament */}
      <g transform={isAlt ? 'translate(900, 200)' : 'translate(680, 210)'} opacity="0.6">
        <text fontSize="72" fill={textColor} fontFamily="Georgia, serif" fontWeight="300">{'{'}</text>
        <text x="44" fontSize="72" fill={textColor} fontFamily="Georgia, serif" fontWeight="300">{'}'}</text>
      </g>

      {/* Small analog gauge - bottom right */}
      <g transform="translate(1310, 780)" opacity="0.7">
        <circle cx="0" cy="0" r="58" fill="none" stroke={protractorStroke} strokeWidth="1.5" />
        <circle cx="0" cy="0" r="50" fill="none" stroke={protractorStroke} strokeWidth="0.8" />
        {Array.from({ length: 11 }, (_, i) => {
          const angleDeg = -150 + i * 30;
          const rad = (angleDeg * Math.PI) / 180;
          const r1 = 50, r2 = i % 5 === 0 ? 42 : 46;
          return (
            <line
              key={i}
              x1={Number((r1 * Math.cos(rad)).toFixed(4))} y1={Number((r1 * Math.sin(rad)).toFixed(4))}
              x2={Number((r2 * Math.cos(rad)).toFixed(4))} y2={Number((r2 * Math.sin(rad)).toFixed(4))}
              stroke={protractorStroke}
              strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
            />
          );
        })}
        {/* Gauge needle */}
        <line x1="0" y1="0" x2="28" y2="18" stroke={accentRed} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="0" cy="0" r="3.5" fill={accentRed} />
        <text x="0" y="30" textAnchor="middle" fontSize="7" fill={textColor} fontFamily="monospace">kPa×100</text>
      </g>

      {/* Red triangle accent - right edge */}
      <polygon points="1400,120 1440,80 1440,160" fill={accentRed} opacity="0.9" />
      {/* Red info block below triangle */}
      <rect x="1412" y="175" width="22" height="40" fill={accentRed} opacity="0.85" rx="1" />
      <rect x="1416" y="170" width="14" height="8" fill={accentRed} opacity="0.85" rx="1" />

      {/* Percentage labels along axis */}
      {['%75', '%50', '%25'].map((label, i) => (
        <text
          key={label}
          x={210 + i * 95}
          y={isAlt ? 580 : 592}
          fontSize="9"
          fill={textColor}
          fontFamily="monospace"
          opacity="0.8"
        >
          {label}
        </text>
      ))}

      {/* Horizontal measurement line with tick */}
      <g opacity="0.6">
        <line x1="330" y1={isAlt ? 540 : 550} x2="660" y2={isAlt ? 540 : 550} stroke={axisColor} strokeWidth="1" strokeDasharray="3 3" />
      </g>

      {/* Small corner squares - top right decoration */}
      <rect x="1050" y="30" width="18" height="18" fill={squareFill} rx="1" />
      <rect x="1075" y="20" width="12" height="12" fill={accentRed} opacity="0.25" rx="1" />
    </svg>
  );
}
