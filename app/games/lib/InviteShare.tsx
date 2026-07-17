"use client";

import { useEffect, useState } from "react";

/**
 * Invite-a-friend controls for online game rooms.
 *
 * Renders a row of share actions for a room invite URL:
 * - "Share" via the Web Share API (mobile OS share sheet: Messages,
 *   WhatsApp, Mail, etc.) — only rendered when `navigator.share` exists.
 * - Email (`mailto:`) and SMS (`sms:`) prefilled fallbacks for desktop
 *   or browsers without Web Share.
 * - Copy link with a transient "copied" state.
 *
 * Styling is supplied by the consuming page via `buttonClassName` /
 * `primaryButtonClassName` so each game keeps its own arcade-token look.
 */
export default function InviteShare({
  url,
  gameName,
  buttonClassName,
  primaryButtonClassName,
}: {
  url: string;
  gameName: string;
  buttonClassName: string;
  primaryButtonClassName?: string;
}) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // navigator is unavailable during SSR; detect share support after mount.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const message = `Play me in ${gameName} on The Arcade! Join my room: ${url}`;
  const subject = `${gameName} challenge — join my game`;

  const nativeShare = async () => {
    try {
      await navigator.share({ title: subject, text: message, url });
    } catch {
      /* user dismissed the sheet — not an error */
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard API blocked (rare) — fall back to a prompt the user can copy from.
      window.prompt("Copy your invite link:", url);
    }
  };

  return (
    <>
      {canNativeShare && (
        <button
          type="button"
          onClick={() => void nativeShare()}
          className={primaryButtonClassName ?? buttonClassName}
        >
          Share invite
        </button>
      )}
      <a
        href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
        className={buttonClassName}
      >
        Email
      </a>
      <a href={`sms:?&body=${encodeURIComponent(message)}`} className={buttonClassName}>
        Text
      </a>
      <button type="button" onClick={() => void copyLink()} className={buttonClassName}>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </>
  );
}
