export function OpenAuraMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5.5 21.5h16.8a5.2 5.2 0 0 0 .2-10.4 7.3 7.3 0 0 0-13.6 2.7 4 4 0 0 0-3.4 7.7Z" fill="var(--logo-cloud-fill, transparent)" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M7 26h18M11 30h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".72" />
      <circle cx="22.5" cy="8.5" r="4.8" fill="var(--logo-sun-fill, #c99a32)" />
      <path d="M22.5.8v2.3M22.5 13.9v2.3M14.8 8.5h2.3M27.9 8.5h2.3M17.1 3.1l1.7 1.7M26.2 12.2l1.7 1.7M27.9 3.1l-1.7 1.7M18.8 12.2l-1.7 1.7" stroke="var(--logo-sun-fill, #c99a32)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
