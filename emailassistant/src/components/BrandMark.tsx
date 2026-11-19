// The app logo: the violet envelope badge from the login screen, plus the name.

export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl shadow-sm"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 60%, #4C1D95 100%)' }}
        aria-hidden="true"
      >
        <svg
          className="h-[18px] w-[18px] text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <polyline points="2,4 12,13 22,4" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-zinc-900">MailAssist AI</span>
    </span>
  );
}
