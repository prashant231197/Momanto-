import Link from 'next/link';

export default function Logo3D({ size = 'md', theme = 'light', showConfetti = true, href = '/' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const isDark = theme === 'dark';

  const iconSize = isSm ? 26 : isLg ? 42 : 32;
  const fontSize = isSm ? 19 : isLg ? 30 : 23;

  const content = (
    <div className={`logo-3d-wrap ${theme} ${size}`}>
      {/* ── 3D CELEBRATION POPPER ICON (Vector 3D with depth) ── */}
      <div className="logo-3d-icon-box" style={{ width: iconSize, height: iconSize }}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="logo-3d-svg"
        >
          <defs>
            {/* Cone Body Gradient */}
            <linearGradient id="coneGrad" x1="8" y1="40" x2="32" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C97A00" />
              <stop offset="35%" stopColor="#FFB300" />
              <stop offset="70%" stopColor="#FFE082" />
              <stop offset="100%" stopColor="#FF8F00" />
            </linearGradient>

            {/* Cone Rim Gradient */}
            <linearGradient id="rimGrad" x1="18" y1="12" x2="38" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFF3D6" />
              <stop offset="50%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#E65100" />
            </linearGradient>

            {/* Blue Stripe */}
            <linearGradient id="blueStripe" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00B4D8" />
              <stop offset="100%" stopColor="#0077B6" />
            </linearGradient>

            {/* Pink Stripe */}
            <linearGradient id="pinkStripe" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4081" />
              <stop offset="100%" stopColor="#C2185B" />
            </linearGradient>

            {/* 3D Drop Shadow */}
            <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="rgba(252, 128, 25, 0.35)" />
            </filter>
          </defs>

          {/* Confetti Explosion Ribbons & Stars */}
          {showConfetti && (
            <g className="logo-confetti-burst">
              {/* Pink wavy ribbon */}
              <path
                d="M26 12C28 7 34 8 36 4C37 2 35 1 33 2C31 4 27 6 26 12Z"
                fill="url(#pinkStripe)"
                className="ribbon-p"
              />
              {/* Blue wavy ribbon */}
              <path
                d="M32 18C38 16 41 11 44 9C46 8 45 6 43 7C39 9 36 13 32 18Z"
                fill="url(#blueStripe)"
                className="ribbon-b"
              />
              {/* Green streamer */}
              <path
                d="M22 10C24 5 21 2 24 1C25 0.5 26 1.5 25 3C23 6 25 8 22 10Z"
                fill="#22C55E"
              />
              {/* Golden Stars & Spheres */}
              <circle cx="38" cy="18" r="2.2" fill="#FFC107" />
              <circle cx="30" cy="5" r="1.8" fill="#00B4D8" />
              <circle cx="20" cy="6" r="2" fill="#FF4081" />
              <path d="M42 5L43 8L46 9L43 10L42 13L41 10L38 9L41 8Z" fill="#FFB703" />
            </g>
          )}

          {/* 3D Party Popper Cone */}
          <g filter="url(#logoShadow)">
            <path
              d="M7 41L23 15C24 13.5 26 13 28 14.5L34 19C35.5 20.2 35.5 22.2 34 23.8L12 43C9.8 44.8 6.5 43 7 41Z"
              fill="url(#coneGrad)"
            />

            {/* Pattern Stripes on Cone */}
            <path
              d="M13 31L20 22C21 21 23 21 24 22L27 24.5C26 27 18 36 18 36L13 31Z"
              fill="url(#pinkStripe)"
              opacity="0.9"
            />
            <path
              d="M10 36L14 30L17 32.5L13 39.5C11.5 39 10.5 37.8 10 36Z"
              fill="url(#blueStripe)"
              opacity="0.9"
            />

            {/* Cone Rim Opening (Glossy Ellipse) */}
            <ellipse
              cx="28"
              cy="18"
              rx="6.5"
              ry="4"
              transform="rotate(-40 28 18)"
              fill="url(#rimGrad)"
            />
          </g>
        </svg>
      </div>

      {/* ── 3D TYPOGRAPHY "Momanto" ── */}
      <div className="logo-3d-text-wrap">
        <span className="logo-3d-text" style={{ fontSize }}>
          Moman<span className="logo-3d-accent">to</span>
        </span>

        {/* Ambient 3D floating dots */}
        {showConfetti && (
          <div className="logo-sparkles">
            <span className="sparkle s-blue">~</span>
            <span className="sparkle s-pink">✦</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .logo-3d-wrap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          user-select: none;
          position: relative;
          cursor: pointer;
        }
        .logo-3d-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .logo-3d-wrap:hover .logo-3d-icon-box {
          transform: rotate(-10deg) scale(1.14);
        }
        .logo-3d-svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }

        .logo-3d-text-wrap {
          display: inline-flex;
          align-items: center;
          position: relative;
        }
        .logo-3d-text {
          font-family: 'Nunito', 'Plus Jakarta Sans', -apple-system, sans-serif;
          font-weight: 900;
          letter-spacing: -0.6px;
          color: ${isDark ? '#FFFFFF' : '#1C1C1C'};
          line-height: 1;
          display: flex;
          align-items: center;
          transition: transform 0.2s;
        }
        .logo-3d-accent {
          background: linear-gradient(135deg, #FF6A00 0%, #FC8019 50%, #FF9E42 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(252, 128, 25, 0.3));
          margin-left: 0.5px;
        }

        /* Floating Micro-Confetti */
        .logo-sparkles {
          position: absolute;
          top: -6px;
          right: -10px;
          pointer-events: none;
          display: flex;
          gap: 3px;
        }
        .sparkle {
          font-size: 10px;
          font-weight: 900;
          line-height: 1;
          animation: floatSparkle 2s ease-in-out infinite alternate;
        }
        .s-blue {
          color: #00B4D8;
          transform: rotate(20deg);
        }
        .s-pink {
          color: #FF4081;
          font-size: 8px;
          animation-delay: 0.4s;
        }

        @keyframes floatSparkle {
          0% { transform: translateY(0) scale(0.9); }
          100% { transform: translateY(-3px) scale(1.15); }
        }
      `}</style>
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex' }}>{content}</Link>;
  }

  return content;
}
