/** Who a SPAM card was set aside for: a card of the step, or an Abomination drawn by hand. */
export type SlotOwner = { kind: 'card' | 'manual'; index: number };

/**
 * One place on the table, in the order the cards were drawn. A SPAM set aside by an Abomination is a card of its own,
 * laid just before the card that called the Abomination (or before the Abomination drawn by hand).
 */
export type TableSlot = { kind: 'card'; index: number } | { kind: 'manual'; index: number } | { kind: 'spam'; id: string; of: SlotOwner; n: number };

/**
 * The places of the table: `cardSpam[i]` lists the SPAMs of the i-th card of the step, `manualSpam[i]` those of the
 * i-th Abomination drawn by hand. Cards come first, then the Abominations drawn by hand, each after its own SPAMs.
 */
export function tableSlots(cardSpam: readonly (readonly string[] | undefined)[], manualSpam: readonly (readonly string[] | undefined)[]): TableSlot[] {
  const slots: TableSlot[] = [];
  const lay = (kind: SlotOwner['kind'], spam: readonly (readonly string[] | undefined)[]) =>
    spam.forEach((ids, index) => {
      (ids ?? []).forEach((id, n) => slots.push({ kind: 'spam', id, of: { kind, index }, n }));
      slots.push({ kind, index } as TableSlot);
    });
  lay('card', cardSpam);
  lay('manual', manualSpam);
  return slots;
}

/** Where an owner sits among the places of the table (-1 when it is not there). */
export const slotOf = (slots: readonly TableSlot[], owner: SlotOwner): number =>
  slots.findIndex((slot) => slot.kind === owner.kind && 'index' in slot && slot.index === owner.index);

/** Where a card or an Abomination drawn by hand comes into view: on its first SPAM if it has any, so the players do not miss it. */
export function entryPosition(slots: readonly TableSlot[], owner: SlotOwner): number {
  let position = slotOf(slots, owner);
  while (position > 0) {
    const before = slots[position - 1];
    if (before.kind !== 'spam' || before.of.kind !== owner.kind || before.of.index !== owner.index) break;
    position--;
  }
  return position;
}

/** A place of the table remembered by who it belongs to, not by its position: a SPAM moving between cards keeps its owner. */
export type SlotRef = SlotOwner | { kind: 'spam'; of: SlotOwner; n: number };

/** Where a remembered place sits now (-1 when its owner is gone: the caller falls back to its default). */
export const slotPosition = (slots: readonly TableSlot[], ref: SlotRef): number =>
  ref.kind === 'spam'
    ? slots.findIndex((slot) => slot.kind === 'spam' && slot.of.kind === ref.of.kind && slot.of.index === ref.of.index && slot.n === ref.n)
    : slotOf(slots, ref);
