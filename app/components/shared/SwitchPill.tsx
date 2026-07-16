import Link from "next/link";

export default function SwitchPill({
  accent,
  className = "",
}: {
  accent: string;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Switch experience"
      className={`font-mono text-[12px] tracking-[.08em] px-[14px] py-[7px] rounded-full border transition-colors ${className}`}
      style={{ borderColor: accent, color: accent }}
    >
      ⇄ SWITCH
    </Link>
  );
}
