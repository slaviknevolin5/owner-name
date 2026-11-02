export function SoccerBall({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`soccer-ball ${className}`.trim()}
      viewBox="0 0 64 64"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="32" r="30" fill="#f5f5f5" stroke="#111" strokeWidth="2" />
      <path
        fill="#111"
        d="M32 14l8.5 6.2-3.2 9.9H26.7l-3.2-9.9L32 14zm-12.8 15.4 6.1-1.9 3.2 9.9-8.2 6.1-4.9-8.4 3.8-5.7zm25.6 0 3.8 5.7-4.9 8.4-8.2-6.1 3.2-9.9 6.1 1.9zM24.8 46.8 32 42.2l7.2 4.6-2.7 8.4H27.5l-2.7-8.4z"
      />
    </svg>
  );
}
