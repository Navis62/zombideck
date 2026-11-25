// A tap that stops a scroll on a card back must not turn the card: the flip asks `scrolledRecently()` first.

/** A tap this soon after the last scroll event is the finger stopping the text (ms). */
const SCROLL_SETTLE_MS = 250;
/** ms between `onScroll` events, iOS only. */
const SCROLL_EVENT_THROTTLE = 16;

let lastScrollAt = -Infinity;

const markScroll = () => {
  lastScrollAt = Date.now();
};

export const SCROLL_TRACKING = {
  onScrollBeginDrag: markScroll,
  onScroll: markScroll,
  onMomentumScrollBegin: markScroll,
  onMomentumScrollEnd: markScroll,
  scrollEventThrottle: SCROLL_EVENT_THROTTLE,
  // Android: keeps the gesture inside the card's pressable (and a modal) instead of handing it up.
  nestedScrollEnabled: true,
} as const;

export function scrolledRecently(now: number = Date.now()): boolean {
  return now - lastScrollAt < SCROLL_SETTLE_MS;
}
