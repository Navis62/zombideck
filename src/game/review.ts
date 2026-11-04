import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const REVIEW_KEY = 'zombideck.review';
/** About two games: enough to have an opinion about the app. */
const DRAWS_BEFORE_ASKING = 60;
/** Stored instead of the draw count once the players have been asked: the app asks only once. */
const ASKED = -1;

let draws: Promise<number> | undefined;

/** Changes the stored draw count; each change waits for the previous one, so quick draws are all counted. */
function updateDraws(change: (count: number) => number): Promise<number> {
  const previous =
    draws ??
    AsyncStorage.getItem(REVIEW_KEY).then(
      (raw) => (Number.isInteger(Number(raw)) ? Number(raw) : 0),
      () => 0,
    );
  draws = previous.then((count) => {
    const next = change(count);
    if (next !== count) {
      AsyncStorage.setItem(REVIEW_KEY, String(next)).catch((error) => console.warn('Could not save the draws', error));
    }
    return next;
  });
  return draws;
}

export function countDraw() {
  void updateDraws((count) => (count === ASKED ? count : count + 1));
}

/** Shows the store rating prompt once, after enough draws; called back on the menu, never during a turn. */
export async function askForReviewIfDue() {
  const count = await updateDraws((current) => current);
  if (count < DRAWS_BEFORE_ASKING) return;
  await updateDraws(() => ASKED);
  try {
    if ((await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) await StoreReview.requestReview();
  } catch (error) {
    console.warn('Could not ask for a review', error);
  }
}
