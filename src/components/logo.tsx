import React from 'react';

// Define the types for the component props
interface LogoProps {
  /** The color of the logo (Hex, RGB, or color name) */
  color?: string;
  /** The width and height of the logo in pixels */
  size?: number;
}

/**
 * TC Monogram Component
 * A high-precision SVG logo for React applications.
 */
const Logo: React.FC<LogoProps> = ({ color = "#D4AF37", size = 512 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. The 'T' (Solid) */}
      <g fill={color}>
        <path d="M160,140 H340 V185 H265 V380 H235 V185 H160 Z" />
      </g>

      {/* 2. The 'C' (Rotated, Translated Right, and Translated Down) */}
      <g transform="translate(175, 29) rotate(90, 250, 250)">
        <path
          d="M335,280 C 370,340 340,410 260,410 C 190,410 160,340 195,275"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
        />
      </g>

      {/* 3. The Ring (Widened to hold the TC combo) */}
      <ellipse
        cx="250"
        cy="250"
        rx="220"
        ry="60"
        transform="rotate(-25, 250, 250)"
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
    </svg>
  );
};

export default Logo;
