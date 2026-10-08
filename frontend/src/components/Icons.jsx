function Svg({ children, size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function LogoIcon() {
  return (
    <Svg size={22}>
      <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  )
}

export function SunIcon() {
  return (
    <Svg size={18}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  )
}

export function MoonIcon() {
  return (
    <Svg size={18}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </Svg>
  )
}

export function CheckIcon() {
  return (
    <Svg size={18}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  )
}

export function ExamIcon({ size = 24 }) {
  return (
    <Svg size={size}>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </Svg>
  )
}

export function GlobeIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
    </Svg>
  )
}

export function WalletIcon() {
  return (
    <Svg>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10h18M16 14.5h2" />
    </Svg>
  )
}

export function ArrowIcon() {
  return (
    <span className="icon-arrow">
      <Svg size={18}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </Svg>
    </span>
  )
}

export function PinIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </Svg>
  )
}

export function ReviewIcon() {
  return (
    <Svg>
      <path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.6" />
      <path d="M4 4v4.6h4.6M9 12.5l2 2 4-4" />
    </Svg>
  )
}

export function ChartIcon() {
  return (
    <Svg>
      <path d="M4 20h16M7 16v-4M12 16V8M17 16v-7" />
    </Svg>
  )
}

export function FlameIcon() {
  return (
    <Svg>
      <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.6-8.3.4 1.9 1.4 3 2.6 3.7.3-2.7 1.6-5 3.6-6.7.1 3.1 3.2 5.4 3.2 10.1 0 4-2.7 7.4-6.5 7.4z" />
    </Svg>
  )
}

export function ClockIcon() {
  return (
    <Svg size={16}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  )
}

export function EyeIcon({ off = false }) {
  return (
    <Svg size={18}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </Svg>
  )
}

export function LockIcon() {
  return (
    <Svg size={16}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </Svg>
  )
}
