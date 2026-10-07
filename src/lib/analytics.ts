/**
 * Custom analytics events, safe to call from client components. A no-op when
 * Umami is not loaded (development, blocked script, not configured yet).
 * Never pass personal data: event data is limited to public identifiers.
 */

export type AnalyticsEvent = "contact-sent" | "comment-sent" | "email-click" | "cta-click";

interface UmamiTracker {
  track: (event: string, data?: Record<string, string | number>) => void;
}

export function track(event: AnalyticsEvent, data?: Record<string, string | number>): void {
  if (typeof window === "undefined") return;
  const umami = (window as unknown as { umami?: UmamiTracker }).umami;
  try {
    umami?.track(event, data);
  } catch {
    // Analytics must never break the page.
  }
}
