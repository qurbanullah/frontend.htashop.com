interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export function Logo({ width = 160, height, className = '' }: LogoProps) {
  const h = height ?? Math.round(width * 0.25)

  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 200 50"
      role="img"
      aria-label="HTAShop"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-middle ${className}`}
    >
      <defs>
        <style>{`
          .logo-hta { fill: #0a1f4f; }
          .logo-shop { fill: #00b4ff; }
          .dark .logo-hta { fill: #ffffff; }
        `}</style>
      </defs>
      <text
        x="100"
        y="27"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="24"
        fontWeight="800"
        letterSpacing="0.5"
      >
        <tspan className="logo-hta">hta</tspan>
        <tspan className="logo-shop">shop</tspan>
      </text>
    </svg>
  )
}
