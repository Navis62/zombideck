/**
 * A card back with a long rule scrolls inside a card that turns over when tapped. A tap that stops the scroll, or lands
 * just after it ends, must not turn the card: every scrolling back spreads SCROLL_TRACKING, and the flip asks
 * `scrolledRecently()` first. One timestamp is enough: a single finger touches one card at a time.
 */

/** A tap this soon after the last scroll or momentum event is the finger stopping the text, not asking for a turn (ms). */
const SCROLL_SETTLE_MS = 250;
/** Fire `onScroll` often enough to keep the timestamp fresh while the text moves (ms between events, iOS only). */
const SCROLL_EVENT_THROTTLE = 16;

let lastScrollAt = -Infinity;

const markScroll = () => {
  lastScrollAt = Date.now();
};

/** Props for a ScrollView on a card back. */
export const SCROLL_TRACKING = {
  onScrollBeginDrag: markScroll,
  onScroll: markScroll,
  onMomentumScrollBegin: markScroll,
  onMomentumScrollEnd: markScroll,
  scrollEventThrottle: SCROLL_EVENT_THROTTLE,
  // Android: the text keeps the gesture inside the card's pressable (and a modal) instead of handing it up.
  nestedScrollEnabled: true,
} as const;

/** Whether a back-side scroll moved, or stopped, within the last moments. */
export function scrolledRecently(now: number = Date.now()): boolean {
  return now - lastScrollAt < SCROLL_SETTLE_MS;
}
